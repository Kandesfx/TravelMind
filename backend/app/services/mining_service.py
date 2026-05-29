import time
import hashlib
import pandas as pd
from app.extensions import db
from app.models.booking import Booking
from app.models.user_booking import UserBooking
from app.models.rule import RuleConfig, AssociationRule
from app.models.data_source import DataSource
from scripts.clean_data import clean_data, create_transactions

# mlxtend is lazy-imported inside functions to avoid matplotlib warnings on startup

def get_rule_hash(antecedent: set, consequent: set) -> str:
    """Generates a unique deterministic SHA256 hash for a rule."""
    ant_str = ",".join(sorted(list(antecedent)))
    con_str = ",".join(sorted(list(consequent)))
    rule_str = f"{ant_str}->{con_str}"
    return hashlib.sha256(rule_str.encode('utf-8')).hexdigest()

def prepare_merged_dataset(only_successful=True):
    """
    Combines datasets from included data sources:
    - Reads Booking table (CSV import)
    - Reads UserBooking table (Web bookings)
    - Standards schemas and runs cleaning pipeline
    - Outputs discrete transaction list
    """
    active_sources = DataSource.query.filter_by(is_included_in_mining=True).all()
    if not active_sources:
        # Default to loading whatever is in Bookings table
        active_sources = [DataSource(source_type='csv')]
        
    frames = []
    
    for source in active_sources:
        if source.source_type == 'csv':
            # Load from Bookings table
            query = db.session.query(Booking)
            if only_successful:
                query = query.filter(Booking.is_canceled == 0)
                
            # Convert query results to pandas DataFrame
            # We fetch columns explicitly
            conn = db.engine.connect()
            sql_query = "SELECT * FROM bookings"
            if only_successful:
                sql_query += " WHERE is_canceled = 0"
            df = pd.read_sql_query(sql_query, conn)
            conn.close()
            df['data_source'] = 'csv'
            frames.append(df)
            
        elif source.source_type == 'web':
            # Load from user_bookings table
            conn = db.engine.connect()
            sql_query = "SELECT * FROM user_bookings"
            if only_successful:
                sql_query += " WHERE status != 'canceled'"
            df = pd.read_sql_query(sql_query, conn)
            conn.close()
            
            # Map user_bookings columns to match CSV column structure
            if not df.empty:
                df = df.rename(columns={
                    'hotel_type': 'hotel',
                    'check_in': 'arrival_date', # We will extract month later
                    'room_type': 'reserved_room_type',
                    'deposit_type': 'deposit_type'
                })
                # Add arrival_date_month
                df['arrival_date'] = pd.to_datetime(df['arrival_date'])
                df['arrival_date_month'] = df['arrival_date'].dt.strftime('%B')
                df['total_of_special_requests'] = df['total_of_special_requests']
                
                # Check repeated guest flag
                df['is_repeated_guest'] = df['is_repeated_guest']
                df['data_source'] = 'web'
                frames.append(df)
                
    if not frames:
        return []
        
    merged = pd.concat(frames, ignore_index=True)
    
    # Clean the merged dataset
    cleaned = clean_data(merged)
    
    # Feature engineer to get the 15 features
    transactions_df = create_transactions(cleaned)
    
    return transactions_df.values.tolist(), cleaned.shape[0]

def run_association_rules_mining(
    algorithm='fpgrowth',
    min_support=0.05,
    min_confidence=0.50,
    min_lift=1.20,
    features_list=None,
    only_successful=True,
    user_id=None
):
    """
    Executes Apriori or FP-Growth, generates rules and saves them to DB.
    """
    start_time = time.time()
    
    # 1. Prepare transactions
    transactions, num_trans = prepare_merged_dataset(only_successful=only_successful)
    if not transactions:
        return None, "Không tìm thấy dữ liệu để khai phá"
        
    # GUARD: If transactions dataset is extremely large, randomly sample 15,000 transactions.
    # A random sample of 15,000 is statistically representative of 119k+ bookings (error margin < 1%)
    # but speeds up execution and avoids memory issues.
    MAX_SAMPLE_TRANSACTIONS = 15000
    if len(transactions) > MAX_SAMPLE_TRANSACTIONS:
        import random
        random.seed(42)  # For reproducible and deterministic mining results
        transactions = random.sample(transactions, MAX_SAMPLE_TRANSACTIONS)
        num_trans = len(transactions)
        
    # If specific features are selected, filter the transactions list
    # The default features order matches requirements
    all_features = [
        'Hotel_Type', 'Meal_Type', 'Room_Type', 'Customer_Type',
        'Channel', 'Deposit', 'Group_Size', 'Season',
        'Price_Range', 'Lead_Time', 'Weekend_Stay', 'Weekday_Stay',
        'Special_Requests', 'Parking', 'Repeat_Guest'
    ]
    
    if not features_list:
        features_list = all_features
        
    # Filter transaction lists to only selected features
    feature_indices = [all_features.index(f) for f in features_list if f in all_features]
    filtered_transactions = []
    for t in transactions:
        filtered_transactions.append([t[i] for i in feature_indices if i < len(t)])
        
    # GUARD: Automatically adjust max_len (maximum items in frequent itemsets) 
    # based on the number of features selected to prevent combinatorial explosion.
    # Most interesting combos have 2 to 3 items. 4 is the upper limit for business usefulness.
    num_selected_features = len(feature_indices)
    if num_selected_features >= 10:
        max_len = 3
    elif num_selected_features >= 6:
        max_len = 4
    else:
        max_len = None
        
    # 2. One-hot encoding (lazy import mlxtend to avoid matplotlib startup warnings)
    from mlxtend.preprocessing import TransactionEncoder
    from mlxtend.frequent_patterns import fpgrowth, apriori, association_rules as mlxtend_rules
    
    te = TransactionEncoder()
    te_array = te.fit(filtered_transactions).transform(filtered_transactions)
    df_encoded = pd.DataFrame(te_array, columns=te.columns_)
    
    # 3. Find frequent itemsets
    if algorithm == 'apriori':
        frequent_itemsets = apriori(df_encoded, min_support=min_support, use_colnames=True, max_len=max_len)
    else:
        frequent_itemsets = fpgrowth(df_encoded, min_support=min_support, use_colnames=True, max_len=max_len)
        
    if frequent_itemsets.empty:
        return None, "Không tìm thấy tập phổ biến nào với support đã chọn"
        
    # 4. Generate rules
    rules = mlxtend_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)
    if rules.empty:
        return None, "Không tìm thấy luật kết hợp nào thỏa mãn confidence đã chọn"
        
    # Filter by lift
    rules = rules[rules['lift'] >= min_lift]
    if rules.empty:
        return None, "Không tìm thấy luật kết hợp nào thỏa mãn lift đã chọn"
        
    # GUARD: Sort rules by lift descending and confidence descending, then cap at 1,000 rules.
    # Saving 100,000+ rules in SQLite is extremely slow, bloats the database file, 
    # and has zero business value since a manager will only examine the top rules.
    rules = rules.sort_values(by=['lift', 'confidence'], ascending=[False, False])
    if len(rules) > 1000:
        rules = rules.head(1000)
        
    execution_time = time.time() - start_time
    
    # 5. Save RuleConfig
    config = RuleConfig(
        algorithm=algorithm,
        min_support=min_support,
        min_confidence=min_confidence,
        min_lift=min_lift,
        features_used=features_list,
        only_successful=only_successful,
        total_transactions=num_trans,
        total_rules_generated=len(rules),
        execution_time_seconds=round(execution_time, 2),
        created_by=user_id
    )
    db.session.add(config)
    db.session.commit()
    
    # 6. Save AssociationRules
    db_rules = []
    for _, row in rules.iterrows():
        ant = list(row['antecedents'])
        con = list(row['consequents'])
        
        # Calculate rule hash to avoid identical rules redundancy if queried
        r_hash = get_rule_hash(set(ant), set(con))
        
        rule = AssociationRule(
            config_id=config.id,
            antecedent=ant,
            consequent=con,
            support=float(row['support']),
            confidence=float(row['confidence']),
            lift=float(row['lift']),
            conviction=float(row['conviction']) if not pd.isna(row['conviction']) else None,
            leverage=float(row['leverage']) if not pd.isna(row['leverage']) else None,
            antecedent_support=float(row['antecedent support']),
            consequent_support=float(row['consequent support']),
            rule_hash=r_hash
        )
        db_rules.append(rule)
        
    db.session.bulk_save_objects(db_rules)
    db.session.commit()
    
    return config, f"Đã sinh thành công {len(rules)} luật kết hợp trong {execution_time:.2f} giây."


def generate_combos_from_rules(config_id):
    """
    Auto-generates Combo records from the top association rules.
    Creates diverse combos for each (hotel_type, group, season) combination.
    Only replaces auto-generated combos (source_rule_id != NULL).
    """
    from app.models.combo import Combo

    config = RuleConfig.query.get(config_id)
    if not config:
        return 0

    rules = AssociationRule.query.filter_by(config_id=config_id).order_by(
        AssociationRule.lift.desc()
    ).all()

    if not rules:
        return 0

    # Delete previously auto-generated combos (keep seed combos)
    Combo.query.filter(Combo.source_rule_id != None).delete(synchronize_session='fetch')
    db.session.commit()

    # Item-to-label mapping for combo names and descriptions
    HOTEL_LABELS = {'Hotel_Resort': 'Resort', 'Hotel_City': 'City Hotel'}
    GROUP_LABELS = {'Group_Solo': 'Solo', 'Group_Couple': 'Couple', 'Group_Family': 'Family', 'Group_Large': 'Large'}
    SEASON_LABELS = {'Season_Spring': 'Spring', 'Season_Summer': 'Summer', 'Season_Autumn': 'Autumn', 'Season_Winter': 'Winter'}
    MEAL_LABELS = {'Meal_BB': 'BB', 'Meal_HB': 'HB', 'Meal_FB': 'FB', 'Meal_SC': 'SC'}
    PRICE_LABELS = {'Price_Budget': 'Budget', 'Price_Mid': 'Mid', 'Price_Premium': 'Premium'}

    COMBO_NAMES = {
        ('Resort', 'Family', 'Summer'): 'Kỳ Nghỉ Hè Gia Đình Resort',
        ('Resort', 'Family', 'Spring'): 'Mùa Xuân Tươi Vui Cùng Gia Đình',
        ('Resort', 'Family', 'Autumn'): 'Thu Vàng Gia Đình Nghỉ Dưỡng',
        ('Resort', 'Family', 'Winter'): 'Đông Ấm Resort Gia Đình',
        ('Resort', 'Couple', 'Summer'): 'Hè Lãng Mạn Bên Biển',
        ('Resort', 'Couple', 'Spring'): 'Xuân Ngọt Ngào Cặp Đôi',
        ('Resort', 'Couple', 'Autumn'): 'Thu Vàng Lãng Mạn Resort',
        ('Resort', 'Couple', 'Winter'): 'Mùa Đông Ấm Áp Đôi Ta',
        ('Resort', 'Solo', 'Summer'): 'Nghỉ Dưỡng Solo Mùa Hè',
        ('Resort', 'Solo', 'Spring'): 'Xuân Một Mình Khám Phá',
        ('Resort', 'Solo', 'Autumn'): 'Thu Tĩnh Lặng Resort',
        ('Resort', 'Solo', 'Winter'): 'Đông Yên Bình Solo',
        ('Resort', 'Large', 'Summer'): 'Hè Sôi Động Nhóm Bạn Resort',
        ('Resort', 'Large', 'Spring'): 'Xuân Rộn Ràng Nhóm Lớn',
        ('Resort', 'Large', 'Autumn'): 'Thu Vui Vẻ Đoàn Nhóm',
        ('Resort', 'Large', 'Winter'): 'Đông Ấm Cúng Nhóm Bạn',
        ('City Hotel', 'Solo', 'Summer'): 'City Express Mùa Hè',
        ('City Hotel', 'Solo', 'Spring'): 'Xuân Công Tác Đô Thị',
        ('City Hotel', 'Solo', 'Autumn'): 'Thu Năng Động City',
        ('City Hotel', 'Solo', 'Winter'): 'Đông Tiện Lợi Công Tác',
        ('City Hotel', 'Couple', 'Summer'): 'Hè Phố Thị Cặp Đôi',
        ('City Hotel', 'Couple', 'Spring'): 'Xuân Đô Thị Lãng Mạn',
        ('City Hotel', 'Couple', 'Autumn'): 'Thu Phố Thị Ngọt Ngào',
        ('City Hotel', 'Couple', 'Winter'): 'Đông Phố Cặp Đôi',
        ('City Hotel', 'Family', 'Summer'): 'Hè Phố Thị Gia Đình',
        ('City Hotel', 'Family', 'Spring'): 'Xuân Đô Thị Gia Đình',
        ('City Hotel', 'Family', 'Autumn'): 'Thu Phố Thị Gia Đình',
        ('City Hotel', 'Family', 'Winter'): 'Đông City Gia Đình',
        ('City Hotel', 'Large', 'Summer'): 'Hè City Đoàn Nhóm',
        ('City Hotel', 'Large', 'Spring'): 'Xuân Phố Thị Nhóm Lớn',
        ('City Hotel', 'Large', 'Autumn'): 'Thu City Đoàn Nhóm',
        ('City Hotel', 'Large', 'Winter'): 'Đông City Nhóm Bạn',
    }

    PRICE_ESTIMATES = {
        ('Resort', 'Budget'): 65.0,
        ('Resort', 'Mid'): 130.0,
        ('Resort', 'Premium'): 210.0,
        ('City Hotel', 'Budget'): 45.0,
        ('City Hotel', 'Mid'): 95.0,
        ('City Hotel', 'Premium'): 165.0,
    }

    DISCOUNT_MAP = {
        'Family': 10.0,
        'Couple': 12.0,
        'Solo': 5.0,
        'Large': 8.0,
    }

    # Extract hotel/group/season from a rule's items
    def extract_profile(items):
        hotel = group = season = meal = price = None
        room_types = []
        other_services = []
        for item in items:
            if item in HOTEL_LABELS:
                hotel = HOTEL_LABELS[item]
            elif item in GROUP_LABELS:
                group = GROUP_LABELS[item]
            elif item in SEASON_LABELS:
                season = SEASON_LABELS[item]
            elif item in MEAL_LABELS:
                meal = MEAL_LABELS[item]
            elif item in PRICE_LABELS:
                price = PRICE_LABELS[item]
            elif item.startswith('Room_'):
                room_types.append(item)
            elif item == 'Parking_Yes':
                other_services.append('Parking')
            elif item.startswith('Dep_'):
                other_services.append(item.replace('Dep_', ''))
            elif item.startswith('Lead_'):
                other_services.append(item)
            elif item.startswith('SpecReq_') and item != 'SpecReq_None':
                other_services.append(item)
        return hotel, group, season, meal, price, room_types, other_services

    # Group rules by (hotel, group, season) profile and pick the best one per group
    seen_profiles = {}
    combos_created = 0

    for rule in rules:
        all_items = rule.antecedent + rule.consequent
        hotel, group, season, meal, price, room_types, other_services = extract_profile(all_items)

        # We need at least hotel OR group to create a meaningful combo
        if not hotel and not group:
            continue

        # Default fallbacks
        hotel = hotel or 'Resort'
        group = group or 'Couple'
        season = season or 'Summer'
        meal = meal or ('HB' if hotel == 'Resort' else 'BB')
        price = price or 'Mid'

        profile_key = (hotel, group, season)

        # Only keep the best rule per profile (first seen = highest lift due to ordering)
        if profile_key in seen_profiles:
            continue
        seen_profiles[profile_key] = True

        # Build services list
        services = [hotel.replace(' ', '_')]
        if meal:
            services.append(meal)
        if room_types:
            services.append(room_types[0])
        else:
            # Default room type based on group
            default_rooms = {'Family': 'Room_D', 'Couple': 'Room_C', 'Solo': 'Room_A', 'Large': 'Room_F'}
            services.append(default_rooms.get(group, 'Room_A'))
        services.extend(other_services[:2])  # Add up to 2 extra services

        # Naming
        combo_name = COMBO_NAMES.get(profile_key, f"Combo {hotel} {group} {season}")
        price_est = PRICE_ESTIMATES.get((hotel, price), 120.0)
        discount = DISCOUNT_MAP.get(group, 8.0)

        # Build slug
        slug = f"auto-{hotel.lower().replace(' ', '-')}-{group.lower()}-{season.lower()}-r{rule.id}"

        # Short description
        group_vn = {'Family': 'gia đình', 'Couple': 'cặp đôi', 'Solo': 'du khách solo', 'Large': 'nhóm bạn'}
        season_vn = {'Summer': 'mùa hè', 'Spring': 'mùa xuân', 'Autumn': 'mùa thu', 'Winter': 'mùa đông'}
        hotel_vn = 'resort nghỉ dưỡng' if hotel == 'Resort' else 'khách sạn trung tâm'

        short_desc = (
            f"Gói combo dành cho {group_vn.get(group, group)} đi {season_vn.get(season, season)} "
            f"tại {hotel_vn}. Được gợi ý từ phân tích hành vi {int(rule.confidence * 100)}% "
            f"khách hàng tương tự."
        )

        combo = Combo(
            name=combo_name,
            slug=slug,
            short_description=short_desc,
            services=services,
            source_rule_id=rule.id,
            match_confidence=round(rule.confidence, 4),
            match_lift=round(rule.lift, 4),
            price_estimate=price_est,
            discount_percent=discount,
            discount_description=f"Giảm {discount}% cho {group_vn.get(group, group)} đặt sớm.",
            target_group=group,
            target_season=season,
            image_url=f"/static/uploads/combo_{combos_created % 3 + 1}.jpg",
            is_active=True,
            display_order=combos_created + 10,
        )
        db.session.add(combo)
        combos_created += 1

        # Limit to 24 combos max (enough diversity)
        if combos_created >= 24:
            break

    db.session.commit()
    return combos_created


def ensure_rules_exist():
    """
    Called on app startup. If no association rules exist in DB,
    automatically runs FP-Growth mining with default parameters
    and generates combos from the results.
    """
    rules_count = AssociationRule.query.count()
    if rules_count > 0:
        print(f"[TravelMind] Found {rules_count} association rules in DB. Skipping auto-mining.")
        return

    # Check if there's data to mine
    bookings_count = Booking.query.count()
    if bookings_count == 0:
        print("[TravelMind] No booking data found. Skipping auto-mining.")
        return

    print(f"[TravelMind] Found 0 rules. Starting auto-mining on {bookings_count} bookings...")

    try:
        config, msg = run_association_rules_mining(
            algorithm='fpgrowth',
            min_support=0.05,
            min_confidence=0.50,
            min_lift=1.20,
            features_list=None,  # All 15 features
            only_successful=True,
            user_id=None
        )

        if config:
            print(f"[TravelMind] Auto-mining completed: {config.total_rules_generated} rules in {config.execution_time_seconds}s")
            # Auto-generate combos
            combos_count = generate_combos_from_rules(config.id)
            print(f"[TravelMind] Auto-generated {combos_count} combos from rules.")
        else:
            print(f"[TravelMind] Auto-mining produced no results: {msg}")
    except Exception as e:
        print(f"[TravelMind] Auto-mining error: {str(e)}")
        import traceback
        traceback.print_exc()
