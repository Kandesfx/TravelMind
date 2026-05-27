import pandas as pd
from app.extensions import db
from app.models.booking import Booking
from app.models.combo import Combo
from sqlalchemy import func

def get_summary_stats():
    """
    Computes landing page stats:
    - Total bookings
    - Total countries
    - Active combos count
    - Success rate (non-canceled bookings percentage)
    """
    total_bookings = db.session.query(func.count(Booking.id)).scalar() or 0
    total_countries = db.session.query(func.count(func.distinct(Booking.country))).scalar() or 0
    total_combos = db.session.query(func.count(Combo.id)).filter_by(is_active=True).scalar() or 0
    
    # Success rate
    canceled_bookings = db.session.query(func.count(Booking.id)).filter(Booking.is_canceled == 1).scalar() or 0
    success_rate = 100.0
    if total_bookings > 0:
        success_rate = ((total_bookings - canceled_bookings) / total_bookings) * 100
        
    return {
        "total_bookings": total_bookings,
        "total_countries": total_countries,
        "total_combos": total_combos,
        "match_percentage": 95, # Mock target match percent
        "success_rate": round(success_rate, 1)
    }

def get_monthly_trends():
    """
    Groups bookings by month to get trends for City vs Resort Hotel and average ADR.
    """
    # Group by arrival_date_month and hotel type
    results = db.session.query(
        Booking.arrival_date_month,
        Booking.hotel,
        func.count(Booking.id),
        func.avg(Booking.adr)
    ).group_by(Booking.arrival_date_month, Booking.hotel).all()
    
    # Organize into dict by month
    months_order = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    trends = {m: {"month": m, "resort": 0, "city": 0, "avg_adr": 0.0} for m in months_order}
    
    # Keep track of counts for weighted average adr
    month_counts = {m: 0 for m in months_order}
    month_adr_sums = {m: 0.0 for m in months_order}
    
    for month, hotel, count, avg_adr in results:
        if month in trends:
            val = avg_adr or 0.0
            if 'resort' in hotel.lower():
                trends[month]["resort"] = count
            else:
                trends[month]["city"] = count
                
            month_counts[month] += count
            month_adr_sums[month] += val * count
            
    # Calculate average adr
    for m in months_order:
        if month_counts[m] > 0:
            trends[m]["avg_adr"] = round(month_adr_sums[m] / month_counts[m], 2)
            
    return [trends[m] for m in months_order]

def get_country_distribution():
    """
    Gets count of bookings by country code for Choropleth map.
    """
    results = db.session.query(
        Booking.country,
        func.count(Booking.id)
    ).filter(Booking.country != None).group_by(Booking.country).order_by(func.count(Booking.id).desc()).all()
    
    total_bookings = db.session.query(func.count(Booking.id)).scalar() or 1
    
    # We map country code to full name for common countries
    common_countries = {
        "PRT": "Portugal", "GBR": "United Kingdom", "FRA": "France", "ESP": "Spain",
        "DEU": "Germany", "ITA": "Italy", "IRL": "Ireland", "BEL": "Belgium",
        "BRA": "Brazil", "NLD": "Netherlands", "USA": "United States", "VNM": "Vietnam"
    }
    
    countries_list = []
    for code, count in results:
        pct = (count / total_bookings) * 100
        countries_list.append({
            "code": code,
            "name": common_countries.get(code, code),
            "count": count,
            "percentage": round(pct, 2)
        })
        
    return countries_list

def get_hotel_comparison_stats():
    """
    Computes comparison metrics for Resort vs City hotels.
    """
    # 1. Total bookings, average ADR, cancellation rate per hotel
    stats_query = db.session.query(
        Booking.hotel,
        func.count(Booking.id),
        func.avg(Booking.adr),
        func.sum(Booking.is_canceled)
    ).group_by(Booking.hotel).all()
    
    hotels = []
    for hotel, total, avg_adr, canceled in stats_query:
        cancel_rate = (canceled / total) * 100 if total > 0 else 0
        
        # Get peak months
        peak_query = db.session.query(
            Booking.arrival_date_month,
            func.count(Booking.id)
        ).filter(Booking.hotel == hotel).group_by(Booking.arrival_date_month).order_by(func.count(Booking.id).desc()).limit(3).all()
        peak_months = [m[0] for m in peak_query]
        
        # Get top countries
        country_query = db.session.query(
            Booking.country,
            func.count(Booking.id)
        ).filter(Booking.hotel == hotel).group_by(Booking.country).order_by(func.count(Booking.id).desc()).limit(3).all()
        top_countries = [c[0] for c in country_query]
        
        # Get top room
        room_query = db.session.query(
            Booking.reserved_room_type,
            func.count(Booking.id)
        ).filter(Booking.hotel == hotel).group_by(Booking.reserved_room_type).order_by(func.count(Booking.id).desc()).limit(1).all()
        top_room = room_query[0][0] if room_query else "A"
        
        # Get top meal
        meal_query = db.session.query(
            Booking.meal,
            func.count(Booking.id)
        ).filter(Booking.hotel == hotel).group_by(Booking.meal).order_by(func.count(Booking.id).desc()).limit(1).all()
        top_meal = meal_query[0][0] if meal_query else "BB"
        
        hotels.append({
            "type": hotel,
            "total_bookings": total,
            "percentage": round((total / max(db.session.query(func.count(Booking.id)).scalar(), 1)) * 100, 1) if total else 0.0,
            "avg_adr": round(avg_adr or 0.0, 1),
            "cancel_rate": round(cancel_rate, 1),
            "top_meal": top_meal,
            "top_room": top_room,
            "peak_months": peak_months,
            "top_countries": top_countries
        })
        
    return hotels
