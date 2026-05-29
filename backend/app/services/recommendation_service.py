from app.extensions import db
from app.models.rule import AssociationRule, RuleConfig
from app.models.combo import Combo
from app.models.room import Room
from app.models.hotel import Hotel
from datetime import date, datetime
import random

# ============================================================
# ITEM CATEGORY HELPERS
# ============================================================

# Map user-facing values to transaction item names
HOTEL_ITEMS = {'resort': 'Hotel_Resort', 'city': 'Hotel_City'}
GROUP_ITEMS = {'family': 'Group_Family', 'couple': 'Group_Couple', 'solo': 'Group_Solo', 'large': 'Group_Large'}
SEASON_ITEMS = {'spring': 'Season_Spring', 'summer': 'Season_Summer', 'autumn': 'Season_Autumn', 'winter': 'Season_Winter'}
BUDGET_ITEMS = {'budget': 'Price_Budget', 'mid': 'Price_Mid', 'premium': 'Price_Premium'}

# Reverse mappings for display
HOTEL_DISPLAY = {'Hotel_Resort': 'Resort', 'Hotel_City': 'City Hotel'}
GROUP_DISPLAY = {'Group_Family': 'Gia đình', 'Group_Couple': 'Cặp đôi', 'Group_Solo': 'Du khách solo', 'Group_Large': 'Nhóm lớn'}
SEASON_DISPLAY = {'Season_Spring': 'Mùa xuân', 'Season_Summer': 'Mùa hè', 'Season_Autumn': 'Mùa thu', 'Season_Winter': 'Mùa đông'}
BUDGET_DISPLAY = {'Price_Budget': 'Tiết kiệm', 'Price_Mid': 'Tầm trung', 'Price_Premium': 'Cao cấp'}

PRICE_ESTIMATES = {
    ('Resort', 'Budget'): 65.0, ('Resort', 'Mid'): 130.0, ('Resort', 'Premium'): 210.0,
    ('City', 'Budget'): 45.0, ('City', 'Mid'): 95.0, ('City', 'Premium'): 165.0,
}

def _get_item_category(item):
    """Returns the category of a transaction item, or None if unknown."""
    if item.startswith('Hotel_'): return 'hotel'
    if item.startswith('Group_'): return 'group'
    if item.startswith('Season_'): return 'season'
    if item.startswith('Price_'): return 'price'
    if item.startswith('Meal_'): return 'meal'
    if item.startswith('Room_'): return 'room'
    if item.startswith('Parking_'): return 'parking'
    if item.startswith('Dep_'): return 'deposit'
    if item.startswith('Lead_'): return 'lead'
    if item.startswith('Weekend_'): return 'weekend'
    if item.startswith('Weekday_'): return 'weekday'
    if item.startswith('SpecReq_'): return 'specreq'
    if item.startswith('Repeat_'): return 'repeat'
    if item.startswith('Cust_'): return 'customer'
    if item.startswith('Ch_'): return 'channel'
    return None


def _extract_services_from_rule(rule):
    """Extract a clean services list from a rule's antecedent + consequent."""
    all_items = rule.antecedent + rule.consequent
    services = []
    seen_categories = set()

    for item in all_items:
        cat = _get_item_category(item)
        if cat in seen_categories:
            continue

        if cat == 'hotel':
            services.append(HOTEL_DISPLAY.get(item, item))
            seen_categories.add(cat)
        elif cat == 'meal':
            services.append(item.replace('Meal_', ''))
            seen_categories.add(cat)
        elif cat == 'room':
            services.append(item)
            seen_categories.add(cat)
        elif item == 'Parking_Yes':
            services.append('Parking')
            seen_categories.add(cat)
        elif cat == 'deposit' and item == 'Dep_NoDeposit':
            services.append('NoDeposit')
            seen_categories.add(cat)

    return services


def _build_services_signature(services):
    """Build a hashable signature for deduplication."""
    return frozenset(services)


# ============================================================
# CORE RECOMMENDATION ENGINE
# ============================================================

def recommend_combos(hotel_type, group, season, budget):
    """
    Finds association rules matching user inputs and suggests top 3 combos.
    
    Scoring: Score = 0.40 * match_ratio + 0.35 * confidence + 0.25 * normalized_lift
    
    Key improvements over original:
    1. Matches user items against BOTH antecedent and consequent
    2. Prioritizes rules where user items appear in the antecedent (stronger match)
    3. Diversifies results by ensuring different service combinations
    4. Falls back to Combo DB with proper filtering by user criteria
    5. Dynamic fallback that changes based on input
    """
    # 1. Map input to transaction items
    hotel_item = HOTEL_ITEMS.get(hotel_type.lower(), 'Hotel_Resort')
    group_item = GROUP_ITEMS.get(group.lower(), 'Group_Couple')
    season_item = SEASON_ITEMS.get(season.lower(), 'Season_Summer')
    budget_item = BUDGET_ITEMS.get(budget.lower(), 'Price_Mid')

    user_items = {hotel_item, group_item, season_item, budget_item}

    # 2. Query RELEVANT association rules only (from latest config)
    #    Use SQL LIKE filters to pre-filter rules containing user items.
    #    This is critical for performance when there are 100K+ rules.
    latest_config = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()

    rules = []
    if latest_config:
        from sqlalchemy import or_

        # Build SQL filters: rules that contain at least one user item in antecedent or consequent
        like_filters = []
        for item in user_items:
            like_filters.append(AssociationRule.antecedent.like(f'%"{item}"%'))
            like_filters.append(AssociationRule.consequent.like(f'%"{item}"%'))

        rules = AssociationRule.query.filter(
            AssociationRule.config_id == latest_config.id,
            or_(*like_filters)
        ).order_by(AssociationRule.lift.desc()).limit(500).all()

    matched_rules = []

    if rules:
        max_lift = max(r.lift for r in rules)

        for rule in rules:
            ant_set = set(rule.antecedent)
            con_set = set(rule.consequent)
            all_items = ant_set | con_set

            # Check overlap with user items across the entire rule
            ant_overlap = ant_set & user_items
            con_overlap = con_set & user_items
            total_overlap = ant_overlap | con_overlap

            if not total_overlap:
                continue

            # Calculate match ratio — give more weight to antecedent matches
            # because antecedent = condition, consequent = result
            ant_match_ratio = len(ant_overlap) / len(ant_set) if ant_set else 0
            total_match_ratio = len(total_overlap) / len(user_items)

            # Combined match ratio: 60% antecedent, 40% total
            match_ratio = 0.6 * ant_match_ratio + 0.4 * total_match_ratio

            # Minimum threshold: at least 1 user item in antecedent, or 2+ in total
            if len(ant_overlap) == 0 and len(total_overlap) < 2:
                continue

            if match_ratio < 0.2:
                continue

            # Score the rule
            lift_norm = rule.lift / max_lift if max_lift > 0 else 0
            score = (0.40 * match_ratio) + (0.35 * rule.confidence) + (0.25 * lift_norm)

            # Bonus: if ALL 4 user items appear somewhere in the rule → boost
            if len(total_overlap) >= 4:
                score += 0.15
            elif len(total_overlap) >= 3:
                score += 0.08

            matched_rules.append({
                "rule": rule,
                "match_ratio": match_ratio,
                "ant_overlap": len(ant_overlap),
                "total_overlap": len(total_overlap),
                "score": score
            })

    # Sort by score descending
    matched_rules.sort(key=lambda x: x["score"], reverse=True)

    # 3. Build recommendations with diversity enforcement
    recommendations = []
    seen_signatures = set()
    seen_meal_room = set()  # Track (meal, room) combos for diversity
    seen_combo_ids = set()  # Track used combo IDs

    for item in matched_rules:
        if len(recommendations) >= 3:
            break

        rule = item["rule"]
        services = _extract_services_from_rule(rule)
        sig = _build_services_signature(services)

        if sig in seen_signatures:
            continue

        # Diversity check: different meal+room combinations
        meal_in_rule = None
        room_in_rule = None
        for s in services:
            if s in ('BB', 'HB', 'FB', 'SC'):
                meal_in_rule = s
            elif s.startswith('Room_'):
                room_in_rule = s
        mr_key = (meal_in_rule, room_in_rule)
        if mr_key in seen_meal_room and len(recommendations) > 0:
            continue

        seen_signatures.add(sig)
        seen_meal_room.add(mr_key)

        # Try to find a matching Combo in DB (avoid reusing same combo)
        combo = Combo.query.filter_by(source_rule_id=rule.id, is_active=True).first()
        if not combo and rank == 1:
            # Only use target_group/season fallback for rank 1
            combo = Combo.query.filter(
                Combo.target_group == group,
                Combo.target_season == season,
                Combo.is_active == True,
                ~Combo.id.in_(seen_combo_ids) if seen_combo_ids else True
            ).first()

        if combo:
            seen_combo_ids.add(combo.id)

        # Build recommendation
        hotel_val = "Resort" if "Hotel_Resort" in (rule.antecedent + rule.consequent) else "City Hotel"

        # Price estimate based on input
        price_key = (hotel_type.capitalize() if hotel_type.lower() != 'city' else 'City', budget.capitalize())
        price_est = PRICE_ESTIMATES.get(price_key, 120.0)

        # Discount varies by group
        discount_map = {'Family': 10.0, 'Couple': 12.0, 'Solo': 5.0, 'Large': 8.0}
        discount = discount_map.get(group, 8.0)

        # Generate meaningful name and description from the rule
        group_vn = {'Family': 'Gia Đình', 'Couple': 'Cặp Đôi', 'Solo': 'Solo', 'Large': 'Nhóm Bạn'}
        season_vn = {'Spring': 'Mùa Xuân', 'Summer': 'Mùa Hè', 'Autumn': 'Mùa Thu', 'Winter': 'Mùa Đông'}
        hotel_vn = 'Resort' if hotel_val == 'Resort' else 'City'

        confidence_pct = int(rule.confidence * 100)

        # Build services list — ensure it's never empty
        if not services:
            services = [hotel_val]
            # Add meal and room from the rule items
            for it in rule.antecedent + rule.consequent:
                if it.startswith('Meal_'):
                    services.append(it.replace('Meal_', ''))
                elif it.startswith('Room_'):
                    services.append(it)
                elif it == 'Parking_Yes':
                    services.append('Parking')
                elif it == 'Dep_NoDeposit':
                    services.append('NoDeposit')
                if len(services) >= 4:
                    break

        # Rank-specific naming for diversity
        rank_suffixes = {
            1: 'Gói Tốt Nhất',
            2: 'Lựa Chọn Thay Thế',
            3: 'Phương Án Khác'
        }

        if combo and rank == 1:
            combo_name = combo.name
            short_desc = combo.short_description
            price_est = combo.price_estimate
            discount = combo.discount_percent
            img = combo.image_url
            combo_id = combo.id
            combo_slug = combo.slug
        else:
            # Generate unique name that reflects the specific rule's services
            service_highlights = []
            for s in services[:3]:
                if s in ('BB', 'HB', 'FB', 'SC'):
                    meal_full = {'BB': 'Ăn Sáng', 'HB': 'Nửa Bữa', 'FB': 'Trọn Gói', 'SC': 'Tự Túc'}
                    service_highlights.append(meal_full.get(s, s))
                elif s.startswith('Room_'):
                    room_label = s.replace('Room_', '')
                    room_names = {'A': 'Standard', 'B': 'Superior', 'C': 'Deluxe', 'D': 'Suite', 'E': 'Premium', 'F': 'Family', 'G': 'VIP'}
                    service_highlights.append(f"Phòng {room_names.get(room_label, room_label)}")
                elif s in ('Resort', 'City Hotel'):
                    service_highlights.append(s)

            if service_highlights:
                combo_name = f"{hotel_vn} {group_vn.get(group, group)} — {' + '.join(service_highlights[:2])}"
            else:
                combo_name = f"Gợi Ý {hotel_vn} {group_vn.get(group, group)} {season_vn.get(season, season)} #{rank}"

            short_desc = (
                f"Combo tối ưu cho {group_vn.get(group, group).lower()} du lịch "
                f"{season_vn.get(season, season).lower()} tại {hotel_vn.lower()}. "
                f"{confidence_pct}% khách hàng có sở thích tương tự đều chọn gói dịch vụ này."
            )
            img = f"/static/uploads/combo_{rank}.jpg"
            combo_id = combo.id if combo else None
            combo_slug = f"suggest-{hotel_vn.lower()}-{group.lower()}-{season.lower()}-{rank}"

        recommendations.append({
            "rank": rank,
            "combo": {
                "id": combo_id,
                "name": combo_name,
                "slug": combo_slug,
                "short_description": short_desc,
                "services": services,
                "price_estimate": price_est,
                "discount_percent": discount,
                "image_url": img
            },
            "match_score": round(item["score"], 3),
            "confidence": round(rule.confidence, 2),
            "lift": round(rule.lift, 2),
            "support": round(rule.support, 3),
            "rule_explanation": _build_rule_explanation(rule, group, season, hotel_type)
        })

    # 4. Fallback: If rules didn't produce enough results, query Combos directly with filtering
    if len(recommendations) < 3:
        # Query combos matching user's criteria
        combo_query = Combo.query.filter_by(is_active=True)

        # Try most specific filter first, then broaden
        filter_combos = combo_query.filter_by(target_group=group, target_season=season).all()
        if not filter_combos:
            filter_combos = combo_query.filter_by(target_group=group).all()
        if not filter_combos:
            filter_combos = combo_query.filter_by(target_season=season).all()
        if not filter_combos:
            filter_combos = combo_query.all()

        existing_ids = {r["combo"]["id"] for r in recommendations if r["combo"]["id"]}

        for combo in filter_combos:
            if len(recommendations) >= 3:
                break
            if combo.id in existing_ids:
                continue
            existing_ids.add(combo.id)

            rank = len(recommendations) + 1
            recommendations.append({
                "rank": rank,
                "combo": combo.to_dict(),
                "match_score": round(0.70 - (rank * 0.05), 3),
                "confidence": combo.match_confidence or 0.60,
                "lift": combo.match_lift or 1.5,
                "support": 0.05,
                "rule_explanation": f"Combo được thiết kế cho {GROUP_DISPLAY.get(GROUP_ITEMS.get(group.lower(), ''), group)} "
                                    f"đi du lịch {SEASON_DISPLAY.get(SEASON_ITEMS.get(season.lower(), ''), season)}."
            })

    # 5. Last resort fallback — context-aware (different per input)
    if not recommendations:
        recommendations = _generate_contextual_fallback(hotel_type, group, season, budget)

    return recommendations


def _build_rule_explanation(rule, group, season, hotel_type):
    """Build a human-readable explanation of why this rule matches."""
    group_vn = {'Family': 'gia đình', 'Couple': 'cặp đôi', 'Solo': 'solo', 'Large': 'nhóm bạn'}
    season_vn = {'Spring': 'mùa xuân', 'Summer': 'mùa hè', 'Autumn': 'mùa thu', 'Winter': 'mùa đông'}

    conf_pct = int(rule.confidence * 100)
    g_vn = group_vn.get(group, group)
    s_vn = season_vn.get(season, season)

    # Extract consequent services for the explanation
    consequent_services = []
    for item in rule.consequent:
        if item.startswith('Meal_'):
            meal_names = {'Meal_BB': 'ăn sáng', 'Meal_HB': 'nửa bữa', 'Meal_FB': 'trọn bữa', 'Meal_SC': 'tự túc'}
            consequent_services.append(f"gói ăn {meal_names.get(item, item)}")
        elif item.startswith('Room_'):
            consequent_services.append(f"phòng hạng {item.replace('Room_', '')}")
        elif item == 'Parking_Yes':
            consequent_services.append("chỗ đỗ xe")
        elif item.startswith('Dep_'):
            dep_names = {'Dep_NoDeposit': 'không cọc', 'Dep_NonRefund': 'cọc không hoàn', 'Dep_Refundable': 'cọc hoàn tiền'}
            consequent_services.append(dep_names.get(item, ''))

    if consequent_services:
        svc_text = ", ".join(consequent_services[:3])
        return f"{conf_pct}% khách {g_vn} đi {s_vn} cũng chọn {svc_text}."
    else:
        return f"{conf_pct}% khách hàng có sở thích tương tự ({g_vn}, {s_vn}) đã chọn gói dịch vụ này."


def _generate_contextual_fallback(hotel_type, group, season, budget):
    """Generate context-aware fallback combos when no rules or DB combos match."""
    group_vn = {'Family': 'Gia Đình', 'Couple': 'Cặp Đôi', 'Solo': 'Solo', 'Large': 'Nhóm Bạn'}
    season_vn = {'Spring': 'Mùa Xuân', 'Summer': 'Mùa Hè', 'Autumn': 'Mùa Thu', 'Winter': 'Mùa Đông'}

    hotel_val = 'Resort' if hotel_type.lower() == 'resort' else 'City'
    price_key = (hotel_val, budget.capitalize())
    base_price = PRICE_ESTIMATES.get(price_key, 100.0)

    # Generate 3 different combos based on input
    meal_options = {
        'Family': ['HB', 'FB', 'BB'],
        'Couple': ['FB', 'HB', 'BB'],
        'Solo': ['BB', 'SC', 'HB'],
        'Large': ['HB', 'BB', 'FB'],
    }
    room_options = {
        'Family': ['Room_D', 'Room_F', 'Room_E'],
        'Couple': ['Room_C', 'Room_E', 'Room_B'],
        'Solo': ['Room_A', 'Room_B', 'Room_C'],
        'Large': ['Room_F', 'Room_G', 'Room_D'],
    }
    extras_options = {
        'Family': [['Parking'], ['NoDeposit'], ['Parking', 'NoDeposit']],
        'Couple': [['NoDeposit'], [], ['Parking']],
        'Solo': [['NoDeposit'], [], []],
        'Large': [['Parking'], ['NoDeposit'], ['Parking', 'NoDeposit']],
    }

    meals = meal_options.get(group, ['BB', 'HB', 'FB'])
    rooms = room_options.get(group, ['Room_A', 'Room_B', 'Room_C'])
    extras = extras_options.get(group, [[], [], []])

    result = []
    for i in range(3):
        services = [hotel_val]
        services.append(meals[i])
        services.append(rooms[i])
        services.extend(extras[i])

        rank_labels = ['⭐ Phù hợp nhất', '👍 Rất phù hợp', '✨ Phù hợp']
        price_adj = base_price + (i * 15) - 10  # slight variation

        result.append({
            "rank": i + 1,
            "combo": {
                "id": None,
                "name": f"Gợi Ý {hotel_val} {group_vn.get(group, group)} {season_vn.get(season, season)} #{i+1}",
                "slug": f"fallback-{hotel_val.lower()}-{group.lower()}-{season.lower()}-{i+1}",
                "short_description": f"Combo {group_vn.get(group, group).lower()} đi "
                                     f"{season_vn.get(season, season).lower()} tại {hotel_val.lower()} "
                                     f"với dịch vụ {meals[i]} và phòng hạng {rooms[i].replace('Room_', '')}.",
                "services": services,
                "price_estimate": price_adj,
                "discount_percent": max(5.0, 12.0 - (i * 3)),
                "image_url": f"/static/uploads/combo_{i+1}.jpg"
            },
            "match_score": round(0.80 - (i * 0.10), 3),
            "confidence": round(0.70 - (i * 0.05), 2),
            "lift": round(1.8 - (i * 0.15), 2),
            "support": 0.06,
            "rule_explanation": f"Gợi ý được xây dựng dựa trên xu hướng chung của "
                                f"{group_vn.get(group, group).lower()} đi {season_vn.get(season, season).lower()}."
        })

    return result


# ============================================================
# SMART ROOM RECOMMENDATIONS (Association Rules-powered)
# ============================================================

def get_smart_room_recommendations(room_id, adults=2, children=0, check_in_str=None):
    """
    Suggests alternative rooms based on client profile + association rules.
    """
    current_room = Room.query.get(room_id)
    if not current_room:
        return []

    hotel = current_room.hotel
    hotel_type = 'Resort' if 'Resort' in (hotel.hotel_type or '') else 'City'

    if children > 0:
        group = 'Family'
    elif adults == 1:
        group = 'Solo'
    elif adults == 2:
        group = 'Couple'
    else:
        group = 'Large'

    season = 'Summer'
    if check_in_str:
        try:
            ci = date.fromisoformat(check_in_str)
            month = ci.month
            if month in [3, 4, 5]: season = 'Spring'
            elif month in [6, 7, 8]: season = 'Summer'
            elif month in [9, 10, 11]: season = 'Autumn'
            else: season = 'Winter'
        except Exception:
            pass

    price = current_room.base_price_per_night
    if price < 80:
        budget = 'Budget'
    elif price <= 150:
        budget = 'Mid'
    else:
        budget = 'Premium'

    hotel_item = f"Hotel_Resort" if hotel_type == 'Resort' else f"Hotel_City"
    group_item = f"Group_{group}"
    season_item = f"Season_{season}"

    budget_map = {'Budget': 'Price_Budget', 'Mid': 'Price_Mid', 'Premium': 'Price_Premium'}
    budget_item = budget_map.get(budget, 'Price_Mid')

    user_items = {hotel_item, group_item, season_item, budget_item}

    # Get rules from latest config
    latest_config = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()
    if latest_config:
        rules = AssociationRule.query.filter_by(config_id=latest_config.id).all()
    else:
        rules = AssociationRule.query.all()

    matched_rules = []

    if rules:
        max_lift = max(r.lift for r in rules) if rules else 1.0
        for rule in rules:
            ant_set = set(rule.antecedent)
            con_set = set(rule.consequent)
            all_rule_items = ant_set | con_set

            overlap = all_rule_items & user_items
            if not overlap:
                continue

            # Must have at least a room type in the rule
            has_room = any(item.startswith('Room_') for item in all_rule_items)
            if not has_room:
                continue

            match_ratio = len(overlap) / len(user_items)
            if match_ratio >= 0.25:
                lift_norm = rule.lift / max_lift
                score = (0.40 * match_ratio) + (0.35 * rule.confidence) + (0.25 * lift_norm)
                matched_rules.append({
                    "rule": rule,
                    "score": score
                })

    matched_rules.sort(key=lambda x: x["score"], reverse=True)

    recommended_room_types = []
    seen_types = {current_room.room_type}

    for item in matched_rules:
        rule = item["rule"]
        for r_item in (rule.consequent + rule.antecedent):
            if r_item.startswith("Room_"):
                rtype = r_item.replace("Room_", "")
                if rtype not in seen_types:
                    seen_types.add(rtype)
                    recommended_room_types.append({
                        "room_type": rtype,
                        "confidence": rule.confidence,
                        "lift": rule.lift,
                        "rule_id": rule.id
                    })

    # Fallback to other types
    for rtype in ['A', 'B', 'C', 'D', 'E', 'F', 'G']:
        if len(recommended_room_types) >= 3:
            break
        if rtype not in seen_types:
            seen_types.add(rtype)
            recommended_room_types.append({
                "room_type": rtype,
                "confidence": 0.65,
                "lift": 1.5,
                "rule_id": None
            })

    recs = []
    for r_info in recommended_room_types[:3]:
        rtype = r_info["room_type"]
        # Find room of this type in the same hotel
        room = Room.query.filter_by(hotel_id=hotel.id, room_type=rtype, is_active=True).first()
        if not room:
            # Fallback to other hotel of same type
            room = Room.query.join(Hotel).filter(
                Hotel.hotel_type == hotel.hotel_type,
                Room.room_type == rtype,
                Room.is_active == True
            ).first()
        if not room:
            room = Room.query.filter_by(room_type=rtype, is_active=True).first()

        if room:
            conf_percent = int(r_info["confidence"] * 100)
            if r_info["rule_id"]:
                reason = f"{conf_percent}% du khách có hành vi tương tự ({group.lower()}, đi vào {season.lower()}) cũng chọn hạng phòng này."
            else:
                reason = f"Hạng phòng được ưa chuộng cho chuyến đi {group.lower()} với ngân sách {budget.lower()}."

            recs.append({
                "room": room.to_dict(),
                "reason": reason,
                "confidence": r_info["confidence"],
                "lift": r_info["lift"]
            })

    return recs


# ============================================================
# UPSELL SUGGESTIONS
# ============================================================

def get_upsell_suggestions(room_id, meal='BB', required_parking=0, lead_time=0, adults=2, children=0):
    """
    Generates intelligent upsell offers based on the booking criteria.
    Uses real association rule statistics when available.
    """
    room = Room.query.get(room_id)
    if not room:
        return []

    hotel = room.hotel
    hotel_type = 'Resort' if 'Resort' in (hotel.hotel_type or '') else 'City'

    # Get real confidence stats from rules if available
    meal_upgrade_conf = _get_rule_confidence('Meal_HB', hotel_type)
    parking_conf = _get_rule_confidence('Parking_Yes', hotel_type)

    suggestions = []

    # 1. Meal upgrade
    if meal == 'BB':
        conf_text = f"{meal_upgrade_conf}%" if meal_upgrade_conf else "84%"
        suggestions.append({
            "type": "meal",
            "title": "Nâng cấp lên gói ăn sáng + tối (Half Board)",
            "description": "Thưởng thức bữa sáng buffet và một bữa ăn chính tại nhà hàng khách sạn mỗi ngày.",
            "price_delta": 25.0,
            "target_value": "HB",
            "reason": f"{conf_text} khách hàng đặt {hotel_type.lower()} nghỉ dưỡng lựa chọn gói ăn HB để tối ưu chi phí ăn uống."
        })
    elif meal == 'HB':
        suggestions.append({
            "type": "meal",
            "title": "Nâng cấp lên gói trọn gói (Full Board)",
            "description": "Bao gồm cả 3 bữa ăn (sáng, trưa, tối) trong ngày cùng đồ uống cơ bản.",
            "price_delta": 20.0,
            "target_value": "FB",
            "reason": "Các nhóm gia đình đi nghỉ dưỡng có xu hướng nâng cấp lên FB để không phải lo nghĩ nơi ăn uống."
        })

    # 2. Parking space
    if hotel_type == 'Resort' and (children > 0 or adults >= 3) and required_parking == 0:
        conf_text = f"{parking_conf}%" if parking_conf else "92%"
        suggestions.append({
            "type": "parking",
            "title": "Đăng ký thêm chỗ đỗ xe",
            "description": "Đảm bảo chỗ đỗ xe riêng an toàn, có mái che ngay trong khuôn viên resort.",
            "price_delta": 10.0,
            "target_value": 1,
            "reason": f"Phân tích luật kết hợp cho thấy gia đình tự lái xe nghỉ dưỡng resort có tỷ lệ đăng ký parking lên đến {conf_text}."
        })

    # 3. Room upgrade
    if lead_time > 30:
        better_rooms = Room.query.filter(
            Room.hotel_id == hotel.id,
            Room.base_price_per_night > room.base_price_per_night,
            Room.is_active == True
        ).order_by(Room.base_price_per_night.asc()).all()

        if better_rooms:
            upgrade_room = better_rooms[0]
            price_diff = upgrade_room.base_price_per_night - room.base_price_per_night
            suggestions.append({
                "type": "room_upgrade",
                "title": f"Nâng cấp lên hạng phòng {upgrade_room.name}",
                "description": f"Không gian rộng hơn ({upgrade_room.area_sqm}m²), view đẹp hơn ({upgrade_room.view_type}) với đầy đủ tiện nghi cao cấp.",
                "price_delta": price_diff,
                "target_value": upgrade_room.id,
                "reason": "Vì bạn đặt phòng sớm hơn 30 ngày, hệ thống đề xuất nâng cấp phòng Suite với ưu đãi giá tốt nhất."
            })

    return suggestions


def _get_rule_confidence(target_item, hotel_type):
    """Get real confidence percentage for a specific item from association rules."""
    hotel_item = f"Hotel_{hotel_type}" if hotel_type in ('Resort', 'City') else None

    latest_config = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()
    if not latest_config:
        return None

    rules = AssociationRule.query.filter_by(config_id=latest_config.id).all()
    best_conf = None

    for rule in rules:
        if target_item in rule.consequent:
            if hotel_item and hotel_item in rule.antecedent:
                conf = int(rule.confidence * 100)
                if best_conf is None or conf > best_conf:
                    best_conf = conf

    return best_conf


# ============================================================
# SIMILAR GUESTS BEHAVIOR (Uses real rules when available)
# ============================================================

def get_similar_guests_behavior(room_id, adults=2, children=0):
    """
    Returns quick highlights of what guests with a similar profile did.
    Uses actual association rule data when available.
    """
    room = Room.query.get(room_id)
    if not room:
        return []

    hotel = room.hotel
    hotel_type = 'Resort' if 'Resort' in (hotel.hotel_type or '') else 'City'

    if children > 0:
        group = 'Family'
    elif adults == 1:
        group = 'Solo'
    elif adults == 2:
        group = 'Couple'
    else:
        group = 'Large'

    # Try to get real insights from rules
    latest_config = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()
    if latest_config:
        rules = AssociationRule.query.filter_by(config_id=latest_config.id).all()
        if rules:
            return _build_real_behavior_insights(rules, hotel_type, group)

    # Fallback to static insights (contextualized by hotel_type and group)
    return _get_static_behavior_insights(hotel_type, group)


def _build_real_behavior_insights(rules, hotel_type, group):
    """Build behavior insights from actual association rules."""
    hotel_item = f"Hotel_{hotel_type}"
    group_item = f"Group_{group}"

    insights = []
    seen_categories = set()

    for rule in sorted(rules, key=lambda r: r.confidence, reverse=True):
        ant_set = set(rule.antecedent)
        con_set = set(rule.consequent)

        # Rule must involve our hotel type or group
        if hotel_item not in ant_set and group_item not in ant_set:
            continue

        conf_pct = int(rule.confidence * 100)

        # Extract insight from consequent
        for item in rule.consequent:
            cat = _get_item_category(item)
            if cat in seen_categories:
                continue

            group_vn = {'Family': 'gia đình', 'Couple': 'cặp đôi', 'Solo': 'khách đi một mình', 'Large': 'nhóm lớn'}
            g_vn = group_vn.get(group, group)

            if cat == 'meal' and item != 'Meal_SC':
                meal_names = {'Meal_BB': 'Bed & Breakfast (BB)', 'Meal_HB': 'Half Board (HB)', 'Meal_FB': 'Full Board (FB)'}
                name = meal_names.get(item, item)
                insights.append(f"{conf_pct}% {g_vn} đi {hotel_type.lower()} cũng chọn gói ăn {name}.")
                seen_categories.add(cat)
            elif cat == 'room':
                room_label = item.replace('Room_', '')
                room_names = {'A': 'Standard', 'B': 'Superior', 'C': 'Deluxe', 'D': 'Suite', 'E': 'Cao cấp', 'F': 'Gia đình', 'G': 'VIP'}
                name = room_names.get(room_label, room_label)
                insights.append(f"Phòng {name} (hạng {room_label}) được {conf_pct}% khách có hồ sơ tương tự lựa chọn.")
                seen_categories.add(cat)
            elif item == 'Parking_Yes':
                insights.append(f"{conf_pct}% {g_vn} yêu cầu chỗ đỗ xe khi đặt {hotel_type.lower()}.")
                seen_categories.add(cat)
            elif cat == 'deposit':
                dep_names = {'Dep_NoDeposit': 'không đặt cọc', 'Dep_NonRefund': 'cọc không hoàn', 'Dep_Refundable': 'cọc hoàn tiền'}
                name = dep_names.get(item, item)
                insights.append(f"{conf_pct}% khách hàng tương tự chọn chính sách {name}.")
                seen_categories.add(cat)

            if len(insights) >= 3:
                break

        if len(insights) >= 3:
            break

    # Fill up with fallback if we don't have enough
    if len(insights) < 3:
        fallback = _get_static_behavior_insights(hotel_type, group)
        for fb in fallback:
            if len(insights) >= 3:
                break
            if fb not in insights:
                insights.append(fb)

    return insights[:3]


def _get_static_behavior_insights(hotel_type, group):
    """Static fallback behavior insights, contextualized."""
    if hotel_type == 'Resort':
        if group == 'Family':
            return [
                "Đa số gia đình đi resort cũng chọn gói ăn Half Board (HB).",
                "Nhiều gia đình yêu cầu thêm chỗ đỗ xe miễn phí.",
                "Phòng Suite rộng rãi loại D hoặc E được ưa chuộng nhất."
            ]
        elif group == 'Couple':
            return [
                "Cặp đôi đi resort thường chọn gói ăn sáng kèm tối (HB).",
                "Phòng Deluxe (loại C) được ưa chuộng nhờ sự lãng mạn và view biển.",
                "Hơn nửa số cặp đôi đặt phòng sớm trên 14 ngày để giữ chỗ."
            ]
        elif group == 'Solo':
            return [
                "Khách solo đi resort thường chọn gói ăn sáng cơ bản (BB).",
                "Phòng Standard hoặc Superior được ưu tiên để tiết kiệm chi phí.",
                "Chính sách không cọc (No Deposit) được ưa chuộng nhất."
            ]
        else:
            return [
                "Nhóm bạn đi resort thường chọn gói ăn Half Board (HB).",
                "Phòng Gia đình (loại F) hoặc Suite được ưa chuộng cho nhóm.",
                "Nhiều nhóm yêu cầu chỗ đỗ xe khi đi resort."
            ]
    else:
        if group == 'Solo':
            return [
                "Khách công tác đi một mình thường chọn gói ăn sáng cơ bản (BB).",
                "Tỷ lệ chọn chính sách Không cọc (No Deposit) rất cao.",
                "Hạng phòng Standard (loại A) là lựa chọn phổ biến nhất."
            ]
        elif group == 'Couple':
            return [
                "Cặp đôi ở city hotel thường chọn gói Bed & Breakfast (BB).",
                "Phòng Deluxe hoặc Superior được ưa chuộng nhờ view thành phố.",
                "Nhiều cặp đôi đặt phòng sát ngày đi để linh hoạt lịch trình."
            ]
        elif group == 'Family':
            return [
                "Gia đình ở city hotel thường chọn gói ăn Half Board (HB).",
                "Phòng Suite hoặc Gia đình được ưa chuộng cho không gian rộng.",
                "Nhiều gia đình yêu cầu thêm chỗ đỗ xe tại trung tâm."
            ]
        else:
            return [
                "Nhóm lớn ở city hotel thường chọn gói Bed & Breakfast (BB).",
                "Đặt phòng sát ngày đi (lead time dưới 7 ngày) rất phổ biến.",
                "Các tầng cao để ngắm toàn cảnh thành phố được ưa chuộng."
            ]
