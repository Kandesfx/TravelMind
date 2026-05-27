import uuid
from datetime import datetime
from app.extensions import db

class UserBooking(db.Model):
    __tablename__ = 'user_bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    combo_id = db.Column(db.Integer, db.ForeignKey('combos.id'), nullable=True)
    voucher_id = db.Column(db.Integer, db.ForeignKey('vouchers.id'), nullable=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hotels.id'), nullable=True, index=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True, index=True)
    
    # Booking reference
    booking_code = db.Column(db.String(12), unique=True, nullable=True, index=True)
    
    # Guest information
    guest_name = db.Column(db.String(100), nullable=True)
    guest_email = db.Column(db.String(120), nullable=True)
    guest_phone = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Relationships
    hotel_ref = db.relationship('Hotel', foreign_keys=[hotel_id], lazy='select')
    room_ref = db.relationship('Room', foreign_keys=[room_id], lazy='select')
    
    # Core features for Association Rules mapping
    hotel_type = db.Column(db.String(20), nullable=False, index=True) # Resort Hotel / City Hotel
    check_in = db.Column(db.Date, nullable=False, index=True)
    check_out = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='confirmed', index=True) # confirmed, completed, canceled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    adults = db.Column(db.Integer, nullable=False, default=2)
    children = db.Column(db.Integer, nullable=False, default=0)
    babies = db.Column(db.Integer, nullable=False, default=0)
    country = db.Column(db.String(5), nullable=False, default='PRT')
    customer_type = db.Column(db.String(20), nullable=False, default='Transient') # Transient, Contract, etc.
    is_repeated_guest = db.Column(db.Integer, nullable=False, default=0)
    
    meal = db.Column(db.String(10), nullable=False, default='BB') # BB, HB, FB, SC
    room_type = db.Column(db.String(5), nullable=False, default='A') # A-H
    deposit_type = db.Column(db.String(20), nullable=False, default='No Deposit')
    market_segment = db.Column(db.String(20), nullable=False, default='Direct')
    required_car_parking_spaces = db.Column(db.Integer, nullable=False, default=0)
    total_of_special_requests = db.Column(db.Integer, nullable=False, default=0)
    
    adr = db.Column(db.Float, nullable=False, default=0.0)
    total_price = db.Column(db.Float, nullable=False, default=0.0)
    stays_in_weekend_nights = db.Column(db.Integer, nullable=False, default=0)
    stays_in_week_nights = db.Column(db.Integer, nullable=False, default=0)
    lead_time = db.Column(db.Integer, nullable=False, default=0)
    
    data_source = db.Column(db.String(10), nullable=False, default='web', index=True) # web / csv
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    @staticmethod
    def generate_booking_code():
        return f"TM-{uuid.uuid4().hex[:8].upper()}"

    def to_dict(self):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "combo_id": self.combo_id,
            "voucher_id": self.voucher_id,
            "hotel_id": self.hotel_id,
            "room_id": self.room_id,
            "booking_code": self.booking_code,
            "guest_name": self.guest_name,
            "guest_email": self.guest_email,
            "guest_phone": self.guest_phone,
            "notes": self.notes,
            "hotel_type": self.hotel_type,
            "check_in": self.check_in.isoformat() if self.check_in else None,
            "check_out": self.check_out.isoformat() if self.check_out else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "adults": self.adults,
            "children": self.children,
            "babies": self.babies,
            "country": self.country,
            "customer_type": self.customer_type,
            "is_repeated_guest": self.is_repeated_guest,
            "meal": self.meal,
            "room_type": self.room_type,
            "deposit_type": self.deposit_type,
            "market_segment": self.market_segment,
            "required_car_parking_spaces": self.required_car_parking_spaces,
            "total_of_special_requests": self.total_of_special_requests,
            "adr": self.adr,
            "total_price": self.total_price,
            "stays_in_weekend_nights": self.stays_in_weekend_nights,
            "stays_in_week_nights": self.stays_in_week_nights,
            "lead_time": self.lead_time,
            "data_source": self.data_source
        }
        # Add related names if relationships loaded
        if self.hotel_id:
            try:
                data["hotel_name"] = self.hotel_ref.name if hasattr(self, 'hotel_ref') and self.hotel_ref else None
            except Exception:
                data["hotel_name"] = None
        if self.room_id:
            try:
                data["room_name"] = self.room_ref.name if hasattr(self, 'room_ref') and self.room_ref else None
            except Exception:
                data["room_name"] = None
        return data
