from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import Combo, Banner, Event, Voucher, UserBooking, QuizResult
from app.services.data_service import (
    get_summary_stats, get_monthly_trends, get_country_distribution, get_hotel_comparison_stats
)
from app.services.recommendation_service import recommend_combos

public_bp = Blueprint('public', __name__)

@public_bp.route('/landing', methods=['GET'])
def landing():
    # 4 combos with highest lift
    hot_combos = Combo.query.filter_by(is_active=True).order_by(Combo.match_lift.desc()).limit(4).all()
    stats = get_summary_stats()
    active_banners = Banner.query.filter_by(position='hero', is_active=True).order_by(Banner.display_order).all()
    trends = get_monthly_trends()
    
    return jsonify({
        "combos": [c.to_dict() for c in hot_combos],
        "stats": stats,
        "banners": [b.to_dict() for b in active_banners],
        "trends": trends[:6] # Only return first 6 months for simple UI widget
    }), 200

@public_bp.route('/hotels', methods=['GET'])
def hotels_list():
    hotel_stats = get_hotel_comparison_stats()
    return jsonify({"hotels": hotel_stats}), 200

@public_bp.route('/combos', methods=['GET'])
def get_combos():
    hotel_type = request.args.get('hotel_type')
    season = request.args.get('season')
    sort_by = request.args.get('sort', 'lift') # lift / confidence / price
    limit = request.args.get('limit', 10, type=int)
    
    query = Combo.query.filter_by(is_active=True)
    
    if hotel_type:
        # Match if services list contains hotel type, e.g. "Resort" or "City"
        # We can also check target_group or check if services JSON has "Resort"
        query = query.filter(Combo.services.like(f'%{hotel_type}%'))
    if season:
        query = query.filter_by(target_season=season)
        
    if sort_by == 'confidence':
        query = query.order_by(Combo.match_confidence.desc())
    elif sort_by == 'price':
        query = query.order_by(Combo.price_estimate.asc())
    else:
        query = query.order_by(Combo.match_lift.desc())
        
    combos = query.limit(limit).all()
    
    return jsonify({
        "combos": [c.to_dict() for c in combos],
        "total": len(combos)
    }), 200

@public_bp.route('/combos/<int:combo_id>', methods=['GET'])
def get_combo_detail(combo_id):
    combo = Combo.query.get_or_404(combo_id)
    
    # Related event
    event_data = None
    if combo.event:
        event_data = {
            "id": combo.event.id,
            "name": combo.event.name,
            "slug": combo.event.slug
        }
        
    # Find active related vouchers
    vouchers = Voucher.query.filter_by(combo_id=combo.id, is_active=True).all()
    # If no combo-specific vouchers, get event vouchers
    if not vouchers and combo.event_id:
        vouchers = Voucher.query.filter_by(event_id=combo.event_id, is_active=True).all()
        
    return jsonify({
        "id": combo.id,
        "name": combo.name,
        "slug": combo.slug,
        "short_description": combo.short_description,
        "full_description": combo.full_description,
        "services": combo.services,
        "price_estimate": combo.price_estimate,
        "discount_percent": combo.discount_percent,
        "discount_description": combo.discount_description,
        "target_group": combo.target_group,
        "target_season": combo.target_season,
        "image_url": combo.image_url,
        "match_confidence": combo.match_confidence,
        "match_lift": combo.match_lift,
        "event": event_data,
        "related_vouchers": [
            {
                "code": v.code,
                "description": v.description,
                "discount_type": v.discount_type,
                "discount_value": v.discount_value,
                "expiry": v.expiry_date.isoformat() if v.expiry_date else None
            } for v in vouchers
        ]
    }), 200

@public_bp.route('/combos/recommend', methods=['POST'])
def recommend():
    data = request.get_json() or {}
    hotel_type = data.get('hotel_type', 'Resort')
    group = data.get('group', 'Couple')
    season = data.get('season', 'Summer')
    budget = data.get('budget', 'Mid')
    
    recs = recommend_combos(hotel_type, group, season, budget)
    
    return jsonify({
        "recommendations": recs,
        "total_rules_matched": len(recs),
        "input": {"hotel_type": hotel_type, "group": group, "season": season, "budget": budget}
    }), 200

@public_bp.route('/quiz/submit', methods=['POST'])
def submit_quiz():
    data = request.get_json() or {}
    answers = data.get('answers', {})
    
    # Answers classification logic to determine persona
    # answers format: {"q1": "a", "q2": "c", ...}
    # Count occurrences of answers (a: Planner, b: Last-Minute, c: Business, d: Romantic, e: Family)
    ans_list = list(answers.values())
    
    # Count choices
    counts = {'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0}
    for ans in ans_list:
        if ans in counts:
            counts[ans] += 1
            
    # Default to Family if tie
    max_choice = max(counts, key=counts.get)
    
    persona_map = {
        'a': {
            "type": "planner",
            "name": "🧳 Planner (Người Lên Kế Hoạch)",
            "description": "Bạn yêu thích việc lập kế hoạch dài hạn, chuẩn bị kỹ càng cho các chuyến nghỉ dưỡng gia đình, ưu tiên dịch vụ Half Board.",
            "percentage": 23
        },
        'b': {
            "type": "last_minute",
            "name": "⚡ Last-Minute Traveler (Khách Phút Chót)",
            "description": "Bạn là người đi ngẫu hứng, đặt phòng cận ngày, thích khám phá thành phố cuối tuần ngắn ngày, ở City Hotel.",
            "percentage": 18
        },
        'c': {
            "type": "business",
            "name": "💼 Business Traveler (Khách Công Tác)",
            "description": "Bạn đi du lịch một mình để làm việc, đòi hỏi đặt phòng City Hotel nhanh gọn, không cọc, kèm ăn sáng BB.",
            "percentage": 15
        },
        'd': {
            "type": "romantic",
            "name": "💑 Romantic Couple (Cặp Đôi Lãng Mạn)",
            "description": "Bạn đi nghỉ dưỡng hai người tại Resort yên tĩnh, chọn các gói trọn gói Full Board cao cấp và không đặt cọc.",
            "percentage": 12
        },
        'e': {
            "type": "family",
            "name": "👨‍👩‍👧‍👦 Family Vacationer (Du Lịch Gia Đình)",
            "description": "Du lịch cùng gia đình có trẻ em, đòi hỏi resort rộng rãi, dịch vụ đầy đủ như chỗ đỗ xe và yêu cầu đặc biệt.",
            "percentage": 32
        }
    }
    
    selected_persona = persona_map.get(max_choice, persona_map['e'])
    
    # Recommend a combo based on persona
    recommended_combo = None
    if selected_persona["type"] == 'family':
        recommended_combo = Combo.query.filter_by(slug='family-summer-pack').first()
    elif selected_persona["type"] == 'romantic':
        recommended_combo = Combo.query.filter_by(slug='romantic-autumn-getaway').first()
    else:
        recommended_combo = Combo.query.filter_by(slug='city-business-express').first()
        
    combo_info = None
    if recommended_combo:
        combo_info = {
            "id": recommended_combo.id,
            "name": recommended_combo.name,
            "slug": recommended_combo.slug,
            "match_confidence": recommended_combo.match_confidence
        }
        
    # Save quiz result in DB if logged in
    uid = current_user.id if current_user.is_authenticated else None
    result = QuizResult(
        user_id=uid,
        answers=answers,
        persona_type=selected_persona["type"],
        recommended_combo_id=recommended_combo.id if recommended_combo else None
    )
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
        "persona": selected_persona,
        "recommended_combo": combo_info
    }), 200

@public_bp.route('/bookings', methods=['POST'])
@login_required
def create_booking():
    data = request.get_json() or {}
    combo_id = data.get('combo_id')
    hotel_type = data.get('hotel_type', 'Resort Hotel')
    check_in_str = data.get('check_in')
    check_out_str = data.get('check_out')
    adults = int(data.get('adults', 2))
    children = int(data.get('children', 0))
    babies = int(data.get('babies', 0))
    meal = data.get('meal', 'BB')
    room_type = data.get('room_type', 'A')
    country = data.get('country', 'VNM')
    deposit_type = data.get('deposit_type', 'No Deposit')
    required_car_parking_spaces = int(data.get('required_car_parking_spaces', 0))
    total_of_special_requests = int(data.get('total_of_special_requests', 0))
    voucher_code = data.get('voucher_code')
    
    # Validation
    if not check_in_str or not check_out_str:
        return jsonify({"error": "Vui lòng chọn ngày check-in và check-out", "code": 400}), 400
        
    try:
        check_in = datetime.strptime(check_in_str, "%Y-%m-%d").date()
        check_out = datetime.strptime(check_out_str, "%Y-%m-%d").date()
    except Exception:
        return jsonify({"error": "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", "code": 400}), 400
        
    if check_in >= check_out:
        return jsonify({"error": "Ngày nhận phòng phải trước ngày trả phòng", "code": 400}), 400
        
    # Calculate stays
    total_nights = (check_out - check_in).days
    weekend_nights = sum(1 for i in range(total_nights) if (check_in + timedelta(days=i)).weekday() >= 5)
    weekday_nights = total_nights - weekend_nights
    
    # Calculate lead time
    lead_time = (check_in - date.today()).days
    if lead_time < 0:
        lead_time = 0
        
    # Base ADR calculation
    base_adr = 120.0 if "resort" in hotel_type.lower() else 90.0
    if room_type in ['D', 'E', 'F']: base_adr += 30.0
    if meal == 'HB': base_adr += 20.0
    elif meal == 'FB': base_adr += 45.0
    
    # Voucher validate
    discount_amount = 0.0
    voucher_id = None
    
    if voucher_code:
        voucher = Voucher.query.filter_by(code=voucher_code, is_active=True).first()
        if voucher and voucher.expiry_date >= date.today() and (voucher.total_quantity > voucher.used_count):
            voucher_id = voucher.id
            if voucher.discount_type == 'percent':
                discount_amount = (base_adr * total_nights) * (voucher.discount_value / 100.0)
                if voucher.max_discount:
                    discount_amount = min(discount_amount, voucher.max_discount)
            else:
                discount_amount = voucher.discount_value
            voucher.used_count += 1
            
    total_price = (base_adr * total_nights) - discount_amount
    if total_price < 0: total_price = 0.0
    
    # Check repeat guest
    prev_bookings = UserBooking.query.filter_by(user_id=current_user.id).count()
    is_repeated = 1 if prev_bookings > 0 else 0
    
    booking = UserBooking(
        user_id=current_user.id,
        combo_id=combo_id,
        voucher_id=voucher_id,
        hotel_type=hotel_type,
        check_in=check_in,
        check_out=check_out,
        status='confirmed',
        adults=adults,
        children=children,
        babies=babies,
        country=country,
        customer_type='Transient',
        is_repeated_guest=is_repeated,
        meal=meal,
        room_type=room_type,
        deposit_type=deposit_type,
        market_segment='Direct',
        required_car_parking_spaces=required_car_parking_spaces,
        total_of_special_requests=total_of_special_requests,
        adr=round(total_price / total_nights, 2) if total_nights > 0 else base_adr,
        total_price=round(total_price, 2),
        stays_in_weekend_nights=weekend_nights,
        stays_in_week_nights=weekday_nights,
        lead_time=lead_time,
        data_source='web'
    )
    
    db.session.add(booking)
    db.session.commit()
    
    return jsonify({
        "booking_id": booking.id,
        "status": "confirmed",
        "total_price": booking.total_price,
        "discount_applied": round(discount_amount, 2),
        "computed_fields": {
            "lead_time": booking.lead_time,
            "adr": booking.adr,
            "stays_in_weekend_nights": booking.stays_in_weekend_nights,
            "stays_in_week_nights": booking.stays_in_week_nights,
            "is_repeated_guest": booking.is_repeated_guest
        },
        "message": "Đặt phòng thành công! Dữ liệu sẵn sàng cho tái phân tích."
    }), 201

@public_bp.route('/vouchers/validate', methods=['POST'])
def validate_voucher():
    data = request.get_json() or {}
    code = data.get('code')
    combo_id = data.get('combo_id')
    total_price = data.get('total_price', 0.0)
    
    if not code:
        return jsonify({"valid": False, "message": "Vui lòng nhập mã giảm giá"}), 400
        
    voucher = Voucher.query.filter_by(code=code, is_active=True).first()
    if not voucher:
        return jsonify({"valid": False, "message": "Mã giảm giá không tồn tại hoặc đã hết hạn"}), 200
        
    if voucher.expiry_date < date.today():
        return jsonify({"valid": False, "message": "Mã giảm giá đã quá hạn sử dụng"}), 200
        
    if voucher.used_count >= voucher.total_quantity:
        return jsonify({"valid": False, "message": "Mã giảm giá đã hết lượt sử dụng"}), 200
        
    if total_price < voucher.min_booking_value:
        return jsonify({"valid": False, "message": f"Mã này chỉ áp dụng cho đơn hàng tối thiểu {voucher.min_booking_value} USD"}), 200
        
    # If voucher is combo-specific
    if voucher.combo_id and voucher.combo_id != combo_id:
        return jsonify({"valid": False, "message": "Mã giảm giá không áp dụng cho combo này"}), 200
        
    # Calculate discount amount
    discount_amount = 0.0
    if voucher.discount_type == 'percent':
        discount_amount = total_price * (voucher.discount_value / 100.0)
        if voucher.max_discount:
            discount_amount = min(discount_amount, voucher.max_discount)
    else:
        discount_amount = voucher.discount_value
        
    final_price = total_price - discount_amount
    if final_price < 0: final_price = 0.0
    
    return jsonify({
        "valid": True,
        "discount_type": voucher.discount_type,
        "discount_value": voucher.discount_value,
        "discount_amount": round(discount_amount, 2),
        "final_price": round(final_price, 2),
        "message": f"Áp dụng thành công! Giảm {voucher.discount_value}% (Tiết kiệm {discount_amount} USD)" if voucher.discount_type == 'percent' else f"Giảm trực tiếp {discount_amount} USD"
    }), 200

@public_bp.route('/insights/trends', methods=['GET'])
def insights_trends():
    trends = get_monthly_trends()
    return jsonify({
        "monthly_bookings": trends,
        "seasonality": {
            "peak": ["July", "August"],
            "low": ["January", "February", "November"],
            "best_value": ["January", "February", "March"]
        }
    }), 200

@public_bp.route('/insights/countries', methods=['GET'])
def insights_countries():
    countries = get_country_distribution()
    return jsonify({
        "countries": countries,
        "total_countries": len(countries)
    }), 200

@public_bp.route('/events', methods=['GET'])
def get_events():
    events = Event.query.filter_by(is_active=True).all()
    return jsonify({
        "events": [
            {
                "id": e.id,
                "name": e.name,
                "slug": e.slug,
                "description": e.description,
                "start_date": e.start_date.isoformat(),
                "end_date": e.end_date.isoformat(),
                "combos_count": len(e.combos),
                "is_active": e.is_active
            } for e in events
        ]
    }), 200

@public_bp.route('/events/<string:slug>', methods=['GET'])
def get_event_detail(slug):
    event = Event.query.filter_by(slug=slug, is_active=True).first_or_404()
    combos = Combo.query.filter_by(event_id=event.id, is_active=True).all()
    vouchers = Voucher.query.filter_by(event_id=event.id, is_active=True).all()
    banners = Banner.query.filter_by(event_id=event.id, is_active=True).all()
    
    return jsonify({
        "id": event.id,
        "name": event.name,
        "slug": event.slug,
        "description": event.description,
        "start_date": event.start_date.isoformat(),
        "end_date": event.end_date.isoformat(),
        "combos": [c.to_dict() for c in combos],
        "vouchers": [v.to_dict() for v in vouchers],
        "banners": [b.to_dict() for b in banners]
    }), 200
