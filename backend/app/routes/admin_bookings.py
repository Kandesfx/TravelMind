from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.user_booking import UserBooking
from app.models.hotel import Hotel
from app.models.room import Room
from sqlalchemy import func, desc
from datetime import date, datetime

admin_bookings_bp = Blueprint('admin_bookings', __name__)


def check_admin():
    return current_user.is_authenticated and current_user.role == 'admin'


@admin_bookings_bp.before_request
@login_required
def before_request():
    if not check_admin():
        return jsonify({"error": "Không có quyền truy cập", "code": 403}), 403


@admin_bookings_bp.route('', methods=['GET'])
def get_bookings():
    """List all bookings with filters, search, and pagination."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    hotel_id = request.args.get('hotel_id', type=int)
    search = request.args.get('search', '').strip()
    sort_by = request.args.get('sort', 'created_at')  # created_at / check_in / total_price
    data_source = request.args.get('data_source')  # web / csv

    query = UserBooking.query

    if status:
        query = query.filter(UserBooking.status == status)
    if hotel_id:
        query = query.filter(UserBooking.hotel_id == hotel_id)
    if data_source:
        query = query.filter(UserBooking.data_source == data_source)
    if search:
        query = query.filter(
            db.or_(
                UserBooking.booking_code.ilike(f'%{search}%'),
                UserBooking.guest_name.ilike(f'%{search}%'),
                UserBooking.guest_email.ilike(f'%{search}%'),
                UserBooking.guest_phone.ilike(f'%{search}%')
            )
        )

    if sort_by == 'check_in':
        query = query.order_by(desc(UserBooking.check_in))
    elif sort_by == 'total_price':
        query = query.order_by(desc(UserBooking.total_price))
    else:
        query = query.order_by(desc(UserBooking.created_at))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    bookings = pagination.items

    return jsonify({
        "bookings": [b.to_dict() for b in bookings],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
        "per_page": per_page,
    }), 200


@admin_bookings_bp.route('/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    booking = UserBooking.query.get_or_404(booking_id)
    data = booking.to_dict()

    # Add related info
    if booking.hotel_id:
        hotel = Hotel.query.get(booking.hotel_id)
        if hotel:
            data['hotel_name'] = hotel.name
            data['hotel_type_full'] = hotel.hotel_type
    if booking.room_id:
        room = Room.query.get(booking.room_id)
        if room:
            data['room_name'] = room.name
            data['room_type_name'] = f"Room {room.room_type} — {room.name}"

    return jsonify(data), 200


@admin_bookings_bp.route('/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    """Update booking status: confirmed → checked_in → completed → canceled."""
    booking = UserBooking.query.get_or_404(booking_id)
    data = request.get_json() or {}
    new_status = data.get('status')

    valid_statuses = ['confirmed', 'checked_in', 'completed', 'canceled']
    if new_status not in valid_statuses:
        return jsonify({"error": f"Trạng thái không hợp lệ. Chọn: {', '.join(valid_statuses)}", "code": 400}), 400

    old_status = booking.status
    booking.status = new_status

    # If canceling, restore room availability
    if new_status == 'canceled' and old_status != 'canceled':
        if booking.room_id:
            room = Room.query.get(booking.room_id)
            if room:
                room.available_count = min(room.available_count + 1, room.total_inventory)

    db.session.commit()

    return jsonify({
        "booking_id": booking.id,
        "booking_code": booking.booking_code,
        "old_status": old_status,
        "new_status": new_status,
        "message": f"Đã cập nhật trạng thái từ {old_status} → {new_status}"
    }), 200


@admin_bookings_bp.route('/stats', methods=['GET'])
def get_booking_stats():
    """Get quick booking statistics for admin dashboard."""
    today = date.today()

    # Today's bookings
    today_bookings = UserBooking.query.filter(
        func.date(UserBooking.created_at) == today,
        UserBooking.data_source == 'web'
    ).count()

    # Total active bookings
    active_bookings = UserBooking.query.filter(
        UserBooking.status.in_(['confirmed', 'checked_in']),
        UserBooking.data_source == 'web'
    ).count()

    # Total revenue from web bookings
    total_revenue = db.session.query(func.sum(UserBooking.total_price)).filter(
        UserBooking.status != 'canceled',
        UserBooking.data_source == 'web'
    ).scalar() or 0

    # Cancel rate
    total_web = UserBooking.query.filter(UserBooking.data_source == 'web').count()
    canceled_web = UserBooking.query.filter(
        UserBooking.data_source == 'web',
        UserBooking.status == 'canceled'
    ).count()
    cancel_rate = (canceled_web / total_web * 100) if total_web > 0 else 0

    # Checking in today
    checking_in_today = UserBooking.query.filter(
        UserBooking.check_in == today,
        UserBooking.status == 'confirmed'
    ).count()

    # Checking out today
    checking_out_today = UserBooking.query.filter(
        UserBooking.check_out == today,
        UserBooking.status.in_(['confirmed', 'checked_in'])
    ).count()

    # Bookings by status
    status_counts = dict(
        db.session.query(
            UserBooking.status, func.count(UserBooking.id)
        ).filter(
            UserBooking.data_source == 'web'
        ).group_by(UserBooking.status).all()
    )

    return jsonify({
        "today_bookings": today_bookings,
        "active_bookings": active_bookings,
        "total_revenue": round(total_revenue, 2),
        "cancel_rate": round(cancel_rate, 1),
        "checking_in_today": checking_in_today,
        "checking_out_today": checking_out_today,
        "status_counts": status_counts,
    }), 200
