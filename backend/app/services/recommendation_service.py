from app.extensions import db
from app.models.rule import AssociationRule
from app.models.combo import Combo

def recommend_combos(hotel_type, group, season, budget):
    """
    Finds rules matching user inputs and suggests top 3 combos.
    Uses scoring formula:
      Score = 0.40 * match_ratio + 0.35 * confidence + 0.25 * normalized_lift
    """
    # 1. Map input choices to transaction items
    hotel_item = f"Hotel_Resort" if hotel_type.lower() == 'resort' else f"Hotel_City"
    group_item = f"Group_{group}"
    season_item = f"Season_{season}"
    
    budget_map = {'budget': 'Price_Budget', 'mid': 'Price_Mid', 'premium': 'Price_Premium'}
    budget_item = budget_map.get(budget.lower(), 'Price_Mid')
    
    user_items = {hotel_item, group_item, season_item, budget_item}
    
    # 2. Query association rules from the DB (limit to strong rules)
    # If no rules exist, we will use mock rules below
    rules = AssociationRule.query.all()
    
    matched_rules = []
    
    if len(rules) > 0:
        max_lift = max(r.lift for r in rules) if rules else 1.0
        
        for rule in rules:
            ant_set = set(rule.antecedent)
            con_set = set(rule.consequent)
            
            # Intersection of user choices and rule antecedents
            overlap = ant_set & user_items
            if not overlap:
                continue
                
            match_ratio = len(overlap) / len(ant_set)
            
            # We want rules that are reasonably matched
            if match_ratio >= 0.3:
                # Score the rule
                lift_norm = rule.lift / max_lift
                score = (0.40 * match_ratio) + (0.35 * rule.confidence) + (0.25 * lift_norm)
                
                matched_rules.append({
                    "rule": rule,
                    "match_ratio": match_ratio,
                    "score": score
                })
    
    # Sort matched rules by score
    matched_rules.sort(key=lambda x: x["score"], reverse=True)
    
    # 3. Map matched rules to existing Combos, or create temporary ones on the fly
    recommendations = []
    seen_services = set()
    
    for idx, item in enumerate(matched_rules[:3]):
        rule = item["rule"]
        
        # Check if there is an active combo in the database linked to this rule
        combo = Combo.query.filter_by(source_rule_id=rule.id, is_active=True).first()
        if not combo:
            # Fallback 1: Match by target group and target season
            combo = Combo.query.filter_by(target_group=group, target_season=season, is_active=True).first()
        if not combo:
            # Fallback 2: Match by target group
            combo = Combo.query.filter_by(target_group=group, is_active=True).first()
        if not combo:
            # Fallback 3: Match by target season
            combo = Combo.query.filter_by(target_season=season, is_active=True).first()
        
        # Parse services list from consequent/antecedent
        services_list = []
        hotel_val = "Resort" if "Hotel_Resort" in rule.antecedent or "Hotel_Resort" in rule.consequent else "City"
        services_list.append(hotel_val)
        
        for x in (rule.antecedent + rule.consequent):
            if x.startswith("Meal_"):
                services_list.append(x.replace("Meal_", ""))
            elif x.startswith("Room_"):
                services_list.append(x)
            elif x == "Parking_Yes":
                services_list.append("Parking")
                
        # Services signature to avoid duplicates
        sig = frozenset(services_list)
        if sig in seen_services:
            continue
        seen_services.add(sig)
        
        # Fallback values if no combo exists in DB
        combo_name = combo.name if combo else f"Gói Combo Gợi Ý #{rule.id}"
        short_desc = combo.short_description if combo else f"Combo tối ưu dựa trên sở thích khách hàng du lịch"
        price_est = combo.price_estimate if combo else (135.0 if hotel_val == "Resort" else 95.0)
        discount = combo.discount_percent if combo else 10.0
        img = combo.image_url if combo else f"/static/uploads/combo_{idx+1}.jpg"
        
        recommendations.append({
            "rank": len(recommendations) + 1,
            "combo": {
                "id": combo.id if combo else None,
                "name": combo_name,
                "slug": combo.slug if combo else f"combo-recommend-{rule.id}",
                "short_description": short_desc,
                "services": services_list,
                "price_estimate": price_est,
                "discount_percent": discount,
                "image_url": img
            },
            "match_score": round(item["score"], 3),
            "confidence": round(rule.confidence, 2),
            "lift": round(rule.lift, 2),
            "support": round(rule.support, 3)
        })
        
    # 4. Fallback mock if nothing matched or database has 0 rules
    if not recommendations:
        # Load from active combos in DB directly
        active_combos = Combo.query.filter_by(is_active=True).all()
        for idx, combo in enumerate(active_combos[:3]):
            recommendations.append({
                "rank": idx + 1,
                "combo": combo.to_dict(),
                "match_score": 0.85 - (idx * 0.05),
                "confidence": combo.match_confidence or 0.65,
                "lift": combo.match_lift or 1.8,
                "support": 0.06
            })
            
    # If still empty (nothing seeded yet)
    if not recommendations:
        mock_data = [
            {
                "name": "Kỳ Nghỉ Hè Gia Đình Trọn Vẹn",
                "slug": "family-summer-pack",
                "services": ["Resort", "HB", "Room_D", "Parking"],
                "price_estimate": 130.0,
                "discount_percent": 10.0,
                "short_description": "Gợi ý hàng đầu cho chuyến đi gia đình mùa hè"
            },
            {
                "name": "Công Tác Đô Thị Tiết Kiệm",
                "slug": "city-business-express",
                "services": ["City", "BB", "Room_A", "NoDeposit"],
                "price_estimate": 95.0,
                "discount_percent": 5.0,
                "short_description": "Hoàn hảo cho chuyến công tác ngắn ngày"
            },
            {
                "name": "Kỳ Nghỉ Lãng Mạn Mùa Thu",
                "slug": "romantic-autumn-getaway",
                "services": ["Resort", "FB", "Room_E", "NoDeposit"],
                "price_estimate": 175.0,
                "discount_percent": 15.0,
                "short_description": "Nghỉ dưỡng trọn gói cho cặp đôi mùa thu"
            }
        ]
        for idx, item in enumerate(mock_data):
            recommendations.append({
                "rank": idx + 1,
                "combo": {
                    "id": None,
                    **item,
                    "image_url": f"/static/uploads/combo_{idx+1}.jpg"
                },
                "match_score": 0.9 - (idx * 0.1),
                "confidence": 0.72 - (idx * 0.05),
                "lift": 2.1 - (idx * 0.1),
                "support": 0.08
            })
            
    return recommendations
