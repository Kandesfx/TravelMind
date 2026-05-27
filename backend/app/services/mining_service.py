import time
import hashlib
import pandas as pd
from app.extensions import db
from app.models.booking import Booking
from app.models.user_booking import UserBooking
from app.models.rule import RuleConfig, AssociationRule
from app.models.data_source import DataSource
from scripts.clean_data import clean_data, create_transactions

# Thư viện mlxtend
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import fpgrowth, apriori, association_rules as mlxtend_rules

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
        
    # 2. One-hot encoding
    te = TransactionEncoder()
    te_array = te.fit(filtered_transactions).transform(filtered_transactions)
    df_encoded = pd.DataFrame(te_array, columns=te.columns_)
    
    # 3. Find frequent itemsets
    if algorithm == 'apriori':
        frequent_itemsets = apriori(df_encoded, min_support=min_support, use_colnames=True)
    else:
        frequent_itemsets = fpgrowth(df_encoded, min_support=min_support, use_colnames=True)
        
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
