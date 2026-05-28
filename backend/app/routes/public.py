from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import Combo, Banner, Event, Voucher, UserBooking, QuizResult, Hotel, Room
from app.services.data_service import (
    get_summary_stats, get_monthly_trends, get_country_distribution, get_hotel_comparison_stats
)
from app.services.recommendation_service import (
    recommend_combos, get_smart_room_recommendations, get_upsell_suggestions, get_similar_guests_behavior
)
from app.services.room_service import (
    search_available_rooms, check_room_availability, calculate_dynamic_price
)

public_bp = Blueprint('public', __name__)

@public_bp.route('/landing', methods=['GET'])
def landing():
    # 4 combos with highest lift
    hot_combos = Combo.query.filter_by(is_active=True).order_by(Combo.match_lift.desc()).limit(4).all()
    stats = get_summary_stats()
    active_banners = Banner.query.filter_by(position='hero', is_active=True).order_by(Banner.display_order).all()
    trends = get_monthly_trends()

    # Featured hotels
    featured_hotels = Hotel.query.filter_by(is_active=True).order_by(Hotel.display_order.asc()).limit(4).all()

    # Featured rooms (cheapest available from each hotel type)
    featured_rooms = []
    for ht in ['Resort Hotel', 'City Hotel']:
        rooms = Room.query.join(Hotel).filter(
            Hotel.hotel_type == ht, Hotel.is_active == True,
            Room.is_active == True, Room.available_count > 0
        ).order_by(Room.base_price_per_night.asc()).limit(3).all()
        featured_rooms.extend([r.to_dict() for r in rooms])

    # Enhance stats with hotel/room counts
    stats['total_hotels'] = Hotel.query.filter_by(is_active=True).count()
    stats['total_room_types'] = Room.query.filter_by(is_active=True).count()

    return jsonify({
        "combos": [c.to_dict() for c in hot_combos],
        "stats": stats,
        "banners": [b.to_dict() for b in active_banners],
        "trends": trends[:6],
        "featured_hotels": [h.to_dict() for h in featured_hotels],
        "featured_rooms": featured_rooms,
    }), 200


# ==========================================
# HOTELS & ROOMS PUBLIC API
# ==========================================
@public_bp.route('/hotels', methods=['GET'])
def get_hotels():
    """List all active hotels with basic room info."""
    hotels = Hotel.query.filter_by(is_active=True).order_by(Hotel.display_order.asc()).all()
    return jsonify({
        "hotels": [h.to_dict() for h in hotels],
        "total": len(hotels)
    }), 200


@public_bp.route('/hotels/<int:hotel_id>', methods=['GET'])
def get_hotel_detail(hotel_id):
    """Get hotel detail with all active rooms."""
    hotel = Hotel.query.filter_by(id=hotel_id, is_active=True).first_or_404()
    return jsonify(hotel.to_dict(include_rooms=True)), 200


@public_bp.route('/hotels/<string:slug>', methods=['GET'])
def get_hotel_by_slug(slug):
    """Get hotel by slug."""
    hotel = Hotel.query.filter_by(slug=slug, is_active=True).first_or_404()
    return jsonify(hotel.to_dict(include_rooms=True)), 200


@public_bp.route('/rooms/search', methods=['GET'])
def search_rooms():
    """Search available rooms with filters."""
    hotel_id = request.args.get('hotel_id', type=int)
    hotel_type = request.args.get('hotel_type')
    check_in = request.args.get('check_in')
    check_out = request.args.get('check_out')
    adults = request.args.get('adults', 2, type=int)
    children = request.args.get('children', 0, type=int)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    room_type = request.args.get('room_type')

    results = search_available_rooms(
        hotel_id=hotel_id, check_in=check_in, check_out=check_out,
        adults=adults, children=children,
        min_price=min_price, max_price=max_price,
        room_type=room_type, hotel_type=hotel_type
    )

    return jsonify({
        "rooms": results,
        "total": len(results),
        "filters": {
            "hotel_id": hotel_id, "hotel_type": hotel_type,
            "check_in": check_in, "check_out": check_out,
            "adults": adults, "children": children,
            "min_price": min_price, "max_price": max_price,
            "room_type": room_type
        }
    }), 200


@public_bp.route('/rooms/<int:room_id>', methods=['GET'])
def get_room_detail(room_id):
    """Get room detail with pricing for given dates."""
    room = Room.query.filter_by(id=room_id, is_active=True).first_or_404()
    room_data = room.to_dict()

    check_in = request.args.get('check_in')
    check_out = request.args.get('check_out')
    meal_type = request.args.get('meal', 'BB')

    if check_in and check_out:
        is_avail, avail_count, msg = check_room_availability(room.id, check_in, check_out)
        total_price, adr, breakdown = calculate_dynamic_price(room, check_in, check_out, meal_type)

        room_data['availability'] = {
            'is_available': is_avail,
            'available_rooms': avail_count,
            'message': msg
        }
        room_data['pricing'] = breakdown
    else:
        room_data['availability'] = {
            'is_available': room.available_count > 0,
            'available_rooms': room.available_count,
        }

    # Hotel info
    room_data['hotel'] = room.hotel.to_dict() if room.hotel else None

    return jsonify(room_data), 200


@public_bp.route('/rooms/<int:room_id>/recommendations', methods=['GET'])
def get_room_recommendations(room_id):
    """Get smart room recommendations based on association rules."""
    room = Room.query.get_or_404(room_id)

    # Extract user context from query params
    adults = request.args.get('adults', 2, type=int)
    children = request.args.get('children', 0, type=int)
    check_in = request.args.get('check_in')

    # Determine context for recommendation
    hotel_type = 'Resort' if 'Resort' in (room.hotel.hotel_type or '') else 'City'

    # Determine group
    if children > 0:
        group = 'Family'
    elif adults == 1:
        group = 'Solo'
    elif adults == 2:
        group = 'Couple'
    else:
        group = 'Large'

    # Determine season from check_in
    season = 'Summer'
    if check_in:
        try:
            ci = date.fromisoformat(check_in)
            month = ci.month
            if month in [3, 4, 5]: season = 'Spring'
            elif month in [6, 7, 8]: season = 'Summer'
            elif month in [9, 10, 11]: season = 'Autumn'
            else: season = 'Winter'
        except Exception:
            pass

    # Determine budget from room price
    price = room.base_price_per_night
    if price < 80:
        budget = 'Budget'
    elif price <= 150:
        budget = 'Mid'
    else:
        budget = 'Premium'

    recs = recommend_combos(hotel_type, group, season, budget)
    
    # Calculate lead_time
    lead_time = 0
    if check_in:
        try:
            ci = date.fromisoformat(check_in)
            lead_time = (ci - date.today()).days
            if lead_time < 0:
                lead_time = 0
        except Exception:
            pass

    smart_rooms = get_smart_room_recommendations(room_id, adults, children, check_in)
    similar_behaviors = get_similar_guests_behavior(room_id, adults, children)
    upsell_suggestions = get_upsell_suggestions(room_id, meal='BB', required_parking=0, lead_time=lead_time, adults=adults, children=children)

    return jsonify({
        "recommendations": recs,
        "smart_rooms": smart_rooms,
        "similar_behaviors": similar_behaviors,
        "upsell_suggestions": upsell_suggestions,
        "context": {"hotel_type": hotel_type, "group": group, "season": season, "budget": budget},
        "current_room": {"id": room.id, "name": room.name, "room_type": room.room_type}
    }), 200


# ==========================================
# EXISTING ENDPOINTS (kept & enhanced)
# ==========================================
@public_bp.route('/hotels/compare', methods=['GET'])
def hotels_compare():
    hotel_stats = get_hotel_comparison_stats()
    return jsonify({"hotels": hotel_stats}), 200


@public_bp.route('/combos', methods=['GET'])
def get_combos():
    hotel_type = request.args.get('hotel_type')
    season = request.args.get('season')
    sort_by = request.args.get('sort', 'lift')
    limit = request.args.get('limit', 10, type=int)

    query = Combo.query.filter_by(is_active=True)

    if hotel_type:
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

    event_data = None
    if combo.event:
        event_data = {"id": combo.event.id, "name": combo.event.name, "slug": combo.event.slug}

    vouchers = Voucher.query.filter_by(combo_id=combo.id, is_active=True).all()
    if not vouchers and combo.event_id:
        vouchers = Voucher.query.filter_by(event_id=combo.event_id, is_active=True).all()

    return jsonify({
        "id": combo.id, "name": combo.name, "slug": combo.slug,
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
            {"code": v.code, "description": v.description, "discount_type": v.discount_type,
             "discount_value": v.discount_value, "expiry": v.expiry_date.isoformat() if v.expiry_date else None}
            for v in vouchers
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

    ans_list = list(answers.values())
    counts = {'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0}
    for ans in ans_list:
        if ans in counts:
            counts[ans] += 1

    max_choice = max(counts, key=counts.get)

    persona_map = {
        'a': {"type": "planner", "name": "🧳 Planner (Người Lên Kế Hoạch)", "description": "Bạn yêu thích việc lập kế hoạch dài hạn, chuẩn bị kỹ càng cho các chuyến nghỉ dưỡng gia đình, ưu tiên dịch vụ Half Board.", "percentage": 23},
        'b': {"type": "last_minute", "name": "⚡ Last-Minute Traveler (Khách Phút Chót)", "description": "Bạn là người đi ngẫu hứng, đặt phòng cận ngày, thích khám phá thành phố cuối tuần ngắn ngày, ở City Hotel.", "percentage": 18},
        'c': {"type": "business", "name": "💼 Business Traveler (Khách Công Tác)", "description": "Bạn đi du lịch một mình để làm việc, đòi hỏi đặt phòng City Hotel nhanh gọn, không cọc, kèm ăn sáng BB.", "percentage": 15},
        'd': {"type": "romantic", "name": "💑 Romantic Couple (Cặp Đôi Lãng Mạn)", "description": "Bạn đi nghỉ dưỡng hai người tại Resort yên tĩnh, chọn các gói trọn gói Full Board cao cấp và không đặt cọc.", "percentage": 12},
        'e': {"type": "family", "name": "👨‍👩‍👧‍👦 Family Vacationer (Du Lịch Gia Đình)", "description": "Du lịch cùng gia đình có trẻ em, đòi hỏi resort rộng rãi, dịch vụ đầy đủ như chỗ đỗ xe và yêu cầu đặc biệt.", "percentage": 32}
    }

    selected_persona = persona_map.get(max_choice, persona_map['e'])

    recommended_combo = None
    if selected_persona["type"] == 'family':
        recommended_combo = Combo.query.filter_by(slug='family-summer-pack').first()
    elif selected_persona["type"] == 'romantic':
        recommended_combo = Combo.query.filter_by(slug='romantic-autumn-getaway').first()
    else:
        recommended_combo = Combo.query.filter_by(slug='city-business-express').first()

    combo_info = None
    if recommended_combo:
        combo_info = {"id": recommended_combo.id, "name": recommended_combo.name, "slug": recommended_combo.slug, "match_confidence": recommended_combo.match_confidence}

    uid = current_user.id if current_user.is_authenticated else None
    result = QuizResult(user_id=uid, answers=answers, persona_type=selected_persona["type"],
                        recommended_combo_id=recommended_combo.id if recommended_combo else None)
    db.session.add(result)
    db.session.commit()

    return jsonify({"persona": selected_persona, "recommended_combo": combo_info}), 200


# ==========================================
# BOOKING FLOW (ENHANCED WITH REAL ROOMS)
# ==========================================
@public_bp.route('/bookings', methods=['POST'])
@login_required
def create_booking():
    data = request.get_json() or {}

    # Required fields
    room_id = data.get('room_id')
    check_in_str = data.get('check_in')
    check_out_str = data.get('check_out')

    # Optional fields
    combo_id = data.get('combo_id')
    meal = data.get('meal', 'BB')
    adults = int(data.get('adults', 2))
    children = int(data.get('children', 0))
    babies = int(data.get('babies', 0))
    country = data.get('country', 'VNM')
    deposit_type = data.get('deposit_type', 'No Deposit')
    required_car_parking_spaces = int(data.get('required_car_parking_spaces', 0))
    total_of_special_requests = int(data.get('total_of_special_requests', 0))
    voucher_code = data.get('voucher_code')
    guest_name = data.get('guest_name', '')
    guest_email = data.get('guest_email', '')
    guest_phone = data.get('guest_phone', '')
    notes = data.get('notes', '')

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

    # Room validation & pricing
    room = None
    hotel = None
    hotel_type = data.get('hotel_type', 'Resort Hotel')

    if room_id:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({"error": "Phòng không tồn tại", "code": 404}), 404

        # Check availability
        is_avail, avail_count, msg = check_room_availability(room.id, check_in, check_out)
        if not is_avail:
            return jsonify({"error": msg, "code": 409}), 409

        hotel = Hotel.query.get(room.hotel_id)
        hotel_type = hotel.hotel_type if hotel else hotel_type

        # Calculate dynamic price
        total_price, adr, breakdown = calculate_dynamic_price(room, check_in, check_out, meal)

        # Decrement availability
        room.available_count = max(0, room.available_count - 1)
    else:
        # Fallback: calculate price from static formula (backward compat)
        total_nights = (check_out - check_in).days
        base_adr = 120.0 if "resort" in hotel_type.lower() else 90.0
        room_type_param = data.get('room_type', 'A')
        if room_type_param in ['D', 'E', 'F']:
            base_adr += 30.0
        if meal == 'HB':
            base_adr += 20.0
        elif meal == 'FB':
            base_adr += 45.0
        total_price = base_adr * total_nights
        adr = base_adr

    # Calculate stays
    total_nights = (check_out - check_in).days
    weekend_nights = sum(1 for i in range(total_nights) if (check_in + timedelta(days=i)).weekday() >= 5)
    weekday_nights = total_nights - weekend_nights

    # Lead time
    lead_time = (check_in - date.today()).days
    if lead_time < 0:
        lead_time = 0

    # Voucher validate
    discount_amount = 0.0
    voucher_id = None

    if voucher_code:
        voucher = Voucher.query.filter_by(code=voucher_code, is_active=True).first()
        if voucher and voucher.expiry_date >= date.today() and (voucher.total_quantity > voucher.used_count):
            voucher_id = voucher.id
            if voucher.discount_type == 'percent':
                discount_amount = total_price * (voucher.discount_value / 100.0)
                if voucher.max_discount:
                    discount_amount = min(discount_amount, voucher.max_discount)
            else:
                discount_amount = voucher.discount_value
            voucher.used_count += 1

    final_price = max(0, total_price - discount_amount)

    # Check repeat guest
    prev_bookings = UserBooking.query.filter_by(user_id=current_user.id).count()
    is_repeated = 1 if prev_bookings > 0 else 0

    booking = UserBooking(
        user_id=current_user.id,
        combo_id=combo_id,
        voucher_id=voucher_id,
        hotel_id=hotel.id if hotel else None,
        room_id=room.id if room else None,
        booking_code=UserBooking.generate_booking_code(),
        guest_name=guest_name or current_user.full_name or current_user.username,
        guest_email=guest_email or current_user.email,
        guest_phone=guest_phone,
        notes=notes,
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
        room_type=room.room_type if room else data.get('room_type', 'A'),
        deposit_type=deposit_type,
        market_segment='Direct',
        required_car_parking_spaces=required_car_parking_spaces,
        total_of_special_requests=total_of_special_requests,
        adr=round(final_price / total_nights, 2) if total_nights > 0 else adr,
        total_price=round(final_price, 2),
        stays_in_weekend_nights=weekend_nights,
        stays_in_week_nights=weekday_nights,
        lead_time=lead_time,
        data_source='web'
    )

    try:
        db.session.add(booking)
        db.session.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": str(e), "traceback": traceback.format_exc(), "code": 500}), 500

    return jsonify({
        "booking_id": booking.id,
        "booking_code": booking.booking_code,
        "status": "confirmed",
        "hotel_name": hotel.name if hotel else None,
        "room_name": room.name if room else None,
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

    if voucher.combo_id and voucher.combo_id != combo_id:
        return jsonify({"valid": False, "message": "Mã giảm giá không áp dụng cho combo này"}), 200

    discount_amount = 0.0
    if voucher.discount_type == 'percent':
        discount_amount = total_price * (voucher.discount_value / 100.0)
        if voucher.max_discount:
            discount_amount = min(discount_amount, voucher.max_discount)
    else:
        discount_amount = voucher.discount_value

    final_price = max(0, total_price - discount_amount)

    return jsonify({
        "valid": True,
        "discount_type": voucher.discount_type,
        "discount_value": voucher.discount_value,
        "discount_amount": round(discount_amount, 2),
        "final_price": round(final_price, 2),
        "message": f"Áp dụng thành công! Giảm {voucher.discount_value}% (Tiết kiệm {discount_amount:.2f} USD)" if voucher.discount_type == 'percent' else f"Giảm trực tiếp {discount_amount:.2f} USD"
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
    return jsonify({"countries": countries, "total_countries": len(countries)}), 200


@public_bp.route('/events', methods=['GET'])
def get_events():
    events = Event.query.filter_by(is_active=True).all()
    return jsonify({
        "events": [
            {"id": e.id, "name": e.name, "slug": e.slug, "description": e.description,
             "start_date": e.start_date.isoformat(), "end_date": e.end_date.isoformat(),
             "combos_count": len(e.combos), "is_active": e.is_active}
            for e in events
        ]
    }), 200


@public_bp.route('/events/<string:slug>', methods=['GET'])
def get_event_detail(slug):
    event = Event.query.filter_by(slug=slug, is_active=True).first_or_404()
    combos = Combo.query.filter_by(event_id=event.id, is_active=True).all()
    vouchers = Voucher.query.filter_by(event_id=event.id, is_active=True).all()
    banners = Banner.query.filter_by(event_id=event.id, is_active=True).all()

    return jsonify({
        "id": event.id, "name": event.name, "slug": event.slug,
        "description": event.description,
        "start_date": event.start_date.isoformat(), "end_date": event.end_date.isoformat(),
        "combos": [c.to_dict() for c in combos],
        "vouchers": [v.to_dict() for v in vouchers],
        "banners": [b.to_dict() for b in banners]
    }), 200
