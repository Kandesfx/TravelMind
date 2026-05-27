"""
room_service.py — Service xử lý logic tìm kiếm, availability, và tính giá phòng.
"""
from datetime import date, timedelta
from app.extensions import db
from app.models.room import Room
from app.models.hotel import Hotel
from app.models.user_booking import UserBooking
from sqlalchemy import and_, or_, func


def get_season(check_date):
    """Determine season from a date."""
    month = check_date.month
    if month in [3, 4, 5]:
        return 'Spring'
    elif month in [6, 7, 8]:
        return 'Summer'
    elif month in [9, 10, 11]:
        return 'Autumn'
    else:
        return 'Winter'


def calculate_dynamic_price(room, check_in, check_out, meal_type='BB'):
    """
    Calculate the total price for a room stay with dynamic seasonal pricing.
    Returns: (total_price, adr, price_breakdown)
    """
    if isinstance(check_in, str):
        check_in = date.fromisoformat(check_in)
    if isinstance(check_out, str):
        check_out = date.fromisoformat(check_out)

    total_nights = (check_out - check_in).days
    if total_nights <= 0:
        return 0, 0, {}

    total_price = 0.0
    weekend_nights = 0
    weekday_nights = 0
    nightly_prices = []

    for i in range(total_nights):
        current_date = check_in + timedelta(days=i)
        is_weekend = current_date.weekday() >= 5  # Saturday = 5, Sunday = 6

        # Base price
        night_price = room.base_price_per_night

        # Apply seasonal multiplier
        season = get_season(current_date)
        if room.seasonal_multiplier and season in room.seasonal_multiplier:
            night_price *= room.seasonal_multiplier[season]

        # Apply weekend surcharge
        if is_weekend:
            night_price += room.weekend_surcharge
            weekend_nights += 1
        else:
            weekday_nights += 1

        nightly_prices.append(round(night_price, 2))
        total_price += night_price

    # Add meal cost
    meal_cost_per_night = 0.0
    if room.meal_options:
        for opt in room.meal_options:
            if opt['type'] == meal_type:
                meal_cost_per_night = opt.get('price', 0)
                break

    total_meal_cost = meal_cost_per_night * total_nights
    total_price += total_meal_cost

    adr = round(total_price / total_nights, 2) if total_nights > 0 else 0

    breakdown = {
        'total_nights': total_nights,
        'weekend_nights': weekend_nights,
        'weekday_nights': weekday_nights,
        'base_price': room.base_price_per_night,
        'season': get_season(check_in),
        'seasonal_multiplier': room.seasonal_multiplier.get(get_season(check_in), 1.0) if room.seasonal_multiplier else 1.0,
        'weekend_surcharge': room.weekend_surcharge,
        'meal_type': meal_type,
        'meal_cost_per_night': meal_cost_per_night,
        'total_meal_cost': round(total_meal_cost, 2),
        'room_cost': round(total_price - total_meal_cost, 2),
        'total_price': round(total_price, 2),
        'adr': adr,
    }

    return round(total_price, 2), adr, breakdown


def check_room_availability(room_id, check_in, check_out):
    """
    Check if a room type has availability for the given date range.
    Counts overlapping bookings and compares with total inventory.
    """
    if isinstance(check_in, str):
        check_in = date.fromisoformat(check_in)
    if isinstance(check_out, str):
        check_out = date.fromisoformat(check_out)

    room = Room.query.get(room_id)
    if not room:
        return False, 0, "Phòng không tồn tại"

    # Count overlapping active bookings for this room type
    overlapping = UserBooking.query.filter(
        UserBooking.room_id == room_id,
        UserBooking.status.in_(['confirmed', 'checked_in']),
        UserBooking.check_in < check_out,
        UserBooking.check_out > check_in
    ).count()

    available = room.total_inventory - overlapping
    if available <= 0:
        return False, 0, "Hết phòng trong khoảng thời gian này"

    return True, available, f"Còn {available} phòng trống"


def search_available_rooms(hotel_id=None, check_in=None, check_out=None,
                           adults=2, children=0, min_price=None, max_price=None,
                           room_type=None, hotel_type=None):
    """
    Search for available rooms with filters.
    Returns list of room dicts with availability and pricing info.
    """
    query = Room.query.join(Hotel).filter(Room.is_active == True, Hotel.is_active == True)

    if hotel_id:
        query = query.filter(Room.hotel_id == hotel_id)

    if hotel_type:
        query = query.filter(Hotel.hotel_type == hotel_type)

    if room_type:
        query = query.filter(Room.room_type == room_type)

    # Capacity filter
    total_guests = adults + children
    query = query.filter(Room.max_occupancy >= total_guests)

    # Price filter (using base_price as proxy — actual price depends on dates)
    if min_price is not None:
        query = query.filter(Room.base_price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Room.base_price_per_night <= max_price)

    query = query.order_by(Room.display_order.asc(), Room.base_price_per_night.asc())

    rooms = query.all()

    results = []
    for room in rooms:
        room_data = room.to_dict()

        # Calculate availability and price if dates provided
        if check_in and check_out:
            is_avail, avail_count, avail_msg = check_room_availability(room.id, check_in, check_out)
            total_price, adr, breakdown = calculate_dynamic_price(room, check_in, check_out)

            room_data['is_available'] = is_avail
            room_data['available_rooms'] = avail_count
            room_data['total_price'] = total_price
            room_data['calculated_adr'] = adr
            room_data['price_breakdown'] = breakdown
        else:
            room_data['is_available'] = room.available_count > 0
            room_data['available_rooms'] = room.available_count
            room_data['total_price'] = None
            room_data['calculated_adr'] = None

        results.append(room_data)

    return results
