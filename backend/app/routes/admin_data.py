from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Booking
from sqlalchemy import func

admin_data_bp = Blueprint('admin_data', __name__)

def check_admin():
    if not current_user.is_authenticated or current_user.role != 'admin':
        return False
    return True

@admin_data_bp.before_request
@login_required
def before_request():
    if not check_admin():
        return jsonify({"error": "Không có quyền truy cập", "code": 403}), 403

@admin_data_bp.route('/dashboard', methods=['GET'])
def dashboard_stats():
    # 1. Total bookings count
    total_bookings = db.session.query(func.count(Booking.id)).scalar() or 0
    
    # 2. Cancellation rate
    canceled_bookings = db.session.query(func.count(Booking.id)).filter(Booking.is_canceled == 1).scalar() or 0
    cancel_rate = (canceled_bookings / total_bookings) * 100 if total_bookings > 0 else 0
    
    # 3. Average ADR
    avg_adr = db.session.query(func.avg(Booking.adr)).scalar() or 0.0
    
    # 4. Total countries count
    total_countries = db.session.query(func.count(func.distinct(Booking.country))).scalar() or 0
    
    # CHARTS DATA
    # Chart A: Monthly Revenue (weighted adr * bookings count)
    monthly_data = db.session.query(
        Booking.arrival_date_month,
        func.sum(Booking.adr * (Booking.stays_in_week_nights + Booking.stays_in_weekend_nights))
    ).filter(Booking.is_canceled == 0).group_by(Booking.arrival_date_month).all()
    
    months_order = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    monthly_rev_map = {m: 0.0 for m in months_order}
    for m, rev in monthly_data:
        if m in monthly_rev_map:
            monthly_rev_map[m] = round(rev or 0.0, 2)
            
    monthly_revenue = [{"month": m, "revenue": monthly_rev_map[m]} for m in months_order]
    
    # Chart B: Distribution Channel
    channel_data = db.session.query(
        Booking.market_segment,
        func.count(Booking.id)
    ).group_by(Booking.market_segment).all()
    channel_distribution = [{"channel": seg or "Other", "value": count} for seg, count in channel_data]
    
    # Chart C: Seasonal Occupancy (Spring, Summer, Autumn, Winter)
    season_data = db.session.query(
        Booking.arrival_date_month,
        func.count(Booking.id)
    ).group_by(Booking.arrival_date_month).all()
    
    season_map = {
        'Spring': 0, 'Summer': 0, 'Autumn': 0, 'Winter': 0
    }
    month_to_season = {
        'March': 'Spring', 'April': 'Spring', 'May': 'Spring',
        'June': 'Summer', 'July': 'Summer', 'August': 'Summer',
        'September': 'Autumn', 'October': 'Autumn', 'November': 'Autumn',
        'December': 'Winter', 'January': 'Winter', 'February': 'Winter'
    }
    for month, count in season_data:
        s = month_to_season.get(month)
        if s in season_map:
            season_map[s] += count
            
    seasonal_occupancy = [{"season": s, "bookings": count} for s, count in season_map.items()]
    
    # Chart D: Top 10 Countries
    country_data = db.session.query(
        Booking.country,
        func.count(Booking.id)
    ).filter(Booking.country != None).group_by(Booking.country).order_by(func.count(Booking.id).desc()).limit(10).all()
    top_countries = [{"country": code, "count": count} for code, count in country_data]
    
    return jsonify({
        "kpis": {
            "total_bookings": total_bookings,
            "cancel_rate": round(cancel_rate, 1),
            "avg_adr": round(avg_adr, 2),
            "total_countries": total_countries
        },
        "charts": {
            "monthly_revenue": monthly_revenue,
            "channel_distribution": channel_distribution,
            "seasonal_occupancy": seasonal_occupancy,
            "top_countries": top_countries
        }
    }), 200

@admin_data_bp.route('/bookings', methods=['GET'])
def get_bookings():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    hotel = request.args.get('hotel')
    month = request.args.get('month')
    meal = request.args.get('meal')
    search = request.args.get('search')
    
    query = Booking.query
    
    if hotel:
        query = query.filter(Booking.hotel.like(f"%{hotel}%"))
    if month:
        query = query.filter_by(arrival_date_month=month)
    if meal:
        query = query.filter_by(meal=meal)
    if search:
        query = query.filter(
            (Booking.country.like(f"%{search}%")) |
            (Booking.customer_type.like(f"%{search}%"))
        )
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    bookings = pagination.items
    
    return jsonify({
        "bookings": [b.to_dict() for b in bookings],
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "total_pages": pagination.pages
    }), 200
