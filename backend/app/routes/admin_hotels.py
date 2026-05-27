from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.hotel import Hotel
from app.models.room import Room
from app.models.user_booking import UserBooking
from sqlalchemy import func

admin_hotels_bp = Blueprint('admin_hotels', __name__)


def check_admin():
    return current_user.is_authenticated and current_user.role == 'admin'


@admin_hotels_bp.before_request
@login_required
def before_request():
    if not check_admin():
        return jsonify({"error": "Không có quyền truy cập", "code": 403}), 403


# ==========================================
# 1. HOTELS CRUD
# ==========================================
@admin_hotels_bp.route('/hotels', methods=['GET'])
def get_hotels():
    hotels = Hotel.query.order_by(Hotel.display_order.asc()).all()
    return jsonify({"hotels": [h.to_dict(include_rooms=True) for h in hotels]}), 200


@admin_hotels_bp.route('/hotels/<int:hotel_id>', methods=['GET'])
def get_hotel(hotel_id):
    hotel = Hotel.query.get_or_404(hotel_id)
    return jsonify(hotel.to_dict(include_rooms=True)), 200


@admin_hotels_bp.route('/hotels', methods=['POST'])
def create_hotel():
    data = request.get_json() or {}
    name = data.get('name')
    slug = data.get('slug', '').lower().replace(' ', '-')
    hotel_type = data.get('hotel_type', 'City Hotel')

    if not name or not slug:
        return jsonify({"error": "Vui lòng nhập tên và slug", "code": 400}), 400

    hotel = Hotel(
        name=name, slug=slug, hotel_type=hotel_type,
        location=data.get('location'), city=data.get('city'),
        country=data.get('country', 'PRT'),
        description=data.get('description'),
        short_description=data.get('short_description'),
        star_rating=int(data.get('star_rating', 4)),
        amenities=data.get('amenities', []),
        check_in_time=data.get('check_in_time', '14:00'),
        check_out_time=data.get('check_out_time', '12:00'),
        cancellation_policy=data.get('cancellation_policy'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        is_active=data.get('is_active', True),
        display_order=int(data.get('display_order', 0))
    )
    db.session.add(hotel)
    db.session.commit()
    return jsonify(hotel.to_dict()), 201


@admin_hotels_bp.route('/hotels/<int:hotel_id>', methods=['PUT'])
def update_hotel(hotel_id):
    hotel = Hotel.query.get_or_404(hotel_id)
    data = request.get_json() or {}

    hotel.name = data.get('name', hotel.name)
    hotel.slug = data.get('slug', hotel.slug)
    hotel.hotel_type = data.get('hotel_type', hotel.hotel_type)
    hotel.location = data.get('location', hotel.location)
    hotel.city = data.get('city', hotel.city)
    hotel.country = data.get('country', hotel.country)
    hotel.description = data.get('description', hotel.description)
    hotel.short_description = data.get('short_description', hotel.short_description)
    hotel.star_rating = int(data.get('star_rating', hotel.star_rating))
    hotel.amenities = data.get('amenities', hotel.amenities)
    hotel.check_in_time = data.get('check_in_time', hotel.check_in_time)
    hotel.check_out_time = data.get('check_out_time', hotel.check_out_time)
    hotel.cancellation_policy = data.get('cancellation_policy', hotel.cancellation_policy)
    hotel.is_active = data.get('is_active', hotel.is_active)
    hotel.display_order = int(data.get('display_order', hotel.display_order))

    db.session.commit()
    return jsonify(hotel.to_dict()), 200


@admin_hotels_bp.route('/hotels/<int:hotel_id>', methods=['DELETE'])
def delete_hotel(hotel_id):
    hotel = Hotel.query.get_or_404(hotel_id)
    db.session.delete(hotel)
    db.session.commit()
    return jsonify({"message": "Đã xóa khách sạn thành công"}), 200


# ==========================================
# 2. ROOMS CRUD
# ==========================================
@admin_hotels_bp.route('/hotels/<int:hotel_id>/rooms', methods=['GET'])
def get_rooms(hotel_id):
    hotel = Hotel.query.get_or_404(hotel_id)
    rooms = Room.query.filter_by(hotel_id=hotel_id).order_by(Room.display_order.asc()).all()
    return jsonify({
        "hotel": {"id": hotel.id, "name": hotel.name, "hotel_type": hotel.hotel_type},
        "rooms": [r.to_dict() for r in rooms]
    }), 200


@admin_hotels_bp.route('/rooms/<int:room_id>', methods=['GET'])
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    return jsonify(room.to_dict()), 200


@admin_hotels_bp.route('/hotels/<int:hotel_id>/rooms', methods=['POST'])
def create_room(hotel_id):
    hotel = Hotel.query.get_or_404(hotel_id)
    data = request.get_json() or {}

    room = Room(
        hotel_id=hotel_id,
        room_type=data.get('room_type', 'A'),
        name=data.get('name', 'New Room'),
        slug=data.get('slug', f'{hotel.slug}-new-room'),
        description=data.get('description'),
        short_description=data.get('short_description'),
        max_adults=int(data.get('max_adults', 2)),
        max_children=int(data.get('max_children', 1)),
        max_occupancy=int(data.get('max_occupancy', 3)),
        bed_type=data.get('bed_type', 'Double'),
        area_sqm=float(data.get('area_sqm', 25)),
        floor_range=data.get('floor_range'),
        view_type=data.get('view_type'),
        base_price_per_night=float(data.get('base_price_per_night', 100)),
        weekend_surcharge=float(data.get('weekend_surcharge', 10)),
        seasonal_multiplier=data.get('seasonal_multiplier', {"Spring": 1.0, "Summer": 1.25, "Autumn": 0.95, "Winter": 0.8}),
        total_inventory=int(data.get('total_inventory', 5)),
        available_count=int(data.get('available_count', 5)),
        amenities=data.get('amenities', []),
        meal_options=data.get('meal_options', []),
        is_active=data.get('is_active', True),
        display_order=int(data.get('display_order', 0))
    )
    db.session.add(room)

    # Update hotel total_rooms
    hotel.total_rooms = Room.query.filter_by(hotel_id=hotel_id, is_active=True).count() + 1
    db.session.commit()
    return jsonify(room.to_dict()), 201


@admin_hotels_bp.route('/rooms/<int:room_id>', methods=['PUT'])
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.get_json() or {}

    room.name = data.get('name', room.name)
    room.room_type = data.get('room_type', room.room_type)
    room.description = data.get('description', room.description)
    room.short_description = data.get('short_description', room.short_description)
    room.max_adults = int(data.get('max_adults', room.max_adults))
    room.max_children = int(data.get('max_children', room.max_children))
    room.max_occupancy = int(data.get('max_occupancy', room.max_occupancy))
    room.bed_type = data.get('bed_type', room.bed_type)
    room.area_sqm = float(data.get('area_sqm', room.area_sqm))
    room.base_price_per_night = float(data.get('base_price_per_night', room.base_price_per_night))
    room.weekend_surcharge = float(data.get('weekend_surcharge', room.weekend_surcharge))
    room.seasonal_multiplier = data.get('seasonal_multiplier', room.seasonal_multiplier)
    room.total_inventory = int(data.get('total_inventory', room.total_inventory))
    room.available_count = int(data.get('available_count', room.available_count))
    room.amenities = data.get('amenities', room.amenities)
    room.meal_options = data.get('meal_options', room.meal_options)
    room.is_active = data.get('is_active', room.is_active)
    room.display_order = int(data.get('display_order', room.display_order))

    db.session.commit()
    return jsonify(room.to_dict()), 200


@admin_hotels_bp.route('/rooms/<int:room_id>', methods=['DELETE'])
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    hotel = Hotel.query.get(room.hotel_id)
    db.session.delete(room)
    if hotel:
        hotel.total_rooms = max(0, Room.query.filter_by(hotel_id=hotel.id, is_active=True).count() - 1)
    db.session.commit()
    return jsonify({"message": "Đã xóa phòng thành công"}), 200


# ==========================================
# 3. OCCUPANCY & REPORTS
# ==========================================
@admin_hotels_bp.route('/occupancy', methods=['GET'])
def get_occupancy_report():
    """Get occupancy statistics for all hotels."""
    hotels = Hotel.query.filter_by(is_active=True).all()
    report = []

    for hotel in hotels:
        rooms = Room.query.filter_by(hotel_id=hotel.id, is_active=True).all()
        total_inventory = sum(r.total_inventory for r in rooms)

        # Count active bookings (confirmed/checked_in)
        active_bookings = UserBooking.query.filter(
            UserBooking.hotel_id == hotel.id,
            UserBooking.status.in_(['confirmed', 'checked_in'])
        ).count()

        occupancy_rate = (active_bookings / total_inventory * 100) if total_inventory > 0 else 0

        # Revenue from completed bookings
        revenue = db.session.query(func.sum(UserBooking.total_price)).filter(
            UserBooking.hotel_id == hotel.id,
            UserBooking.status.in_(['confirmed', 'completed', 'checked_in'])
        ).scalar() or 0

        report.append({
            "hotel_id": hotel.id,
            "hotel_name": hotel.name,
            "hotel_type": hotel.hotel_type,
            "total_inventory": total_inventory,
            "room_types_count": len(rooms),
            "active_bookings": active_bookings,
            "occupancy_rate": round(occupancy_rate, 1),
            "total_revenue": round(revenue, 2)
        })

    return jsonify({"occupancy": report}), 200
