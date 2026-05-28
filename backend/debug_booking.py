import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath('d:/TravelMind-main/backend'))

from app import create_app
from app.extensions import db
from app.models import User, Room, Hotel, UserBooking
from datetime import date
import traceback

app = create_app()

with app.app_context():
    try:
        user = User.query.first()
        room = Room.query.first()
        hotel = room.hotel
        
        print(f"Using user: {user.username}")
        print(f"Using room: {room.id} ({room.room_type})")
        
        booking = UserBooking(
            user_id=user.id,
            combo_id=2,
            voucher_id=None,
            hotel_id=hotel.id,
            room_id=room.id,
            booking_code=UserBooking.generate_booking_code(),
            guest_name="dsa",
            guest_email="test@example.com",
            guest_phone="123456789",
            notes="",
            hotel_type="Resort Hotel",
            check_in=date(2027, 7, 15),
            check_out=date(2027, 7, 18),
            status='confirmed',
            adults=5,
            children=0,
            babies=0,
            country="VNM",
            customer_type='Transient',
            is_repeated_guest=0,
            meal="BB",
            room_type=room.room_type,
            deposit_type="No Deposit",
            market_segment='Direct',
            required_car_parking_spaces=0,
            total_of_special_requests=0,
            adr=80.0,
            total_price=240.0,
            stays_in_weekend_nights=1,
            stays_in_week_nights=2,
            lead_time=400,
            data_source='web'
        )
        
        db.session.add(booking)
        db.session.commit()
        print("Booking successful!")
        
        # Cleanup
        db.session.delete(booking)
        db.session.commit()
    except Exception as e:
        print("Error occurred:")
        traceback.print_exc()
