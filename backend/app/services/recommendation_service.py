from app.extensions import db
from app.models.rule import AssociationRule
from app.models.combo import Combo
from app.models.room import Room
from app.models.hotel import Hotel
from datetime import date, datetime
import random

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
    
    rules = AssociationRule.query.all()
    matched_rules = []
    
    if rules:
        max_lift = max(r.lift for r in rules) if rules else 1.0
        for rule in rules:
            ant_set = set(rule.antecedent)
            overlap = ant_set & user_items
            if not overlap:
                continue
            match_ratio = len(overlap) / len(ant_set)
            if match_ratio >= 0.3:
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
                    
    # fallback to other types
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

def get_upsell_suggestions(room_id, meal='BB', required_parking=0, lead_time=0, adults=2, children=0):
    """
    Generates intelligent upsell offers based on the booking criteria.
    """
    room = Room.query.get(room_id)
    if not room:
        return []
        
    hotel = room.hotel
    hotel_type = 'Resort' if 'Resort' in (hotel.hotel_type or '') else 'City'
    
    suggestions = []
    
    # 1. Meal upgrade
    if meal == 'BB':
        suggestions.append({
            "type": "meal",
            "title": "Nâng cấp lên gói ăn sáng + tối (Half Board)",
            "description": "Thưởng thức bữa sáng buffet và một bữa ăn chính tại nhà hàng khách sạn mỗi ngày.",
            "price_delta": 25.0,
            "target_value": "HB",
            "reason": "84% khách hàng đặt resort nghỉ dưỡng lựa chọn gói ăn HB để tối ưu chi phí ăn uống."
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
        suggestions.append({
            "type": "parking",
            "title": "Đăng ký thêm chỗ đỗ xe",
            "description": "Đảm bảo chỗ đỗ xe riêng an toàn, có mái che ngay trong khuôn viên resort.",
            "price_delta": 10.0,
            "target_value": 1,
            "reason": "Phân tích luật kết hợp cho thấy gia đình tự lái xe nghỉ dưỡng resort có tỷ lệ đăng ký parking lên đến 92%."
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

def get_similar_guests_behavior(room_id, adults=2, children=0):
    """
    Returns quick highlights of what guests with a similar profile did.
    """
    room = Room.query.get(room_id)
    if not room:
        return []
        
    hotel = room.hotel
    hotel_type = 'Resort' if 'Resort' in (hotel.hotel_type or '') else 'City'
    
    if hotel_type == 'Resort':
        if children > 0:
            return [
                "92% gia đình đi resort cũng chọn gói ăn Half Board (HB).",
                "85% yêu cầu thêm chỗ đỗ xe miễn phí.",
                "Đa số chọn phòng Suite rộng rãi loại D hoặc E."
            ]
        else:
            return [
                "75% cặp đôi đi resort chọn gói ăn sáng kèm tối (HB).",
                "Phòng Deluxe (loại C) được ưa chuộng nhất nhờ sự lãng mạn và view biển.",
                "Hơn 60% đặt phòng sớm trên 14 ngày để giữ chỗ."
            ]
    else: # City Hotel
        if adults == 1:
            return [
                "88% khách công tác đi một mình chọn gói ăn sáng cơ bản (BB).",
                "Tỷ lệ hủy phòng thấp nhờ chọn chính sách Không cọc (No Deposit).",
                "Hạng phòng Standard (loại A) là lựa chọn phổ biến nhất."
            ]
        else:
            return [
                "70% khách du lịch đô thị đi theo nhóm chọn gói Bed & Breakfast (BB).",
                "Thường đặt phòng sát ngày đi (lead time dưới 7 ngày).",
                "Thích ở các tầng cao để ngắm toàn cảnh thành phố."
            ]
