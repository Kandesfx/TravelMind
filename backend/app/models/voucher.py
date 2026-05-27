from datetime import datetime
from app.extensions import db

class Voucher(db.Model):
    __tablename__ = 'vouchers'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    discount_type = db.Column(db.String(20), nullable=False) # percent / fixed
    discount_value = db.Column(db.Float, nullable=False, default=0.0)
    max_discount = db.Column(db.Float, nullable=True) # Max discount amount in USD
    min_booking_value = db.Column(db.Float, default=0.0)
    conditions = db.Column(db.JSON, nullable=True) # e.g., {"room_type": "D", "days_min": 3}
    total_quantity = db.Column(db.Integer, default=100)
    used_count = db.Column(db.Integer, default=0)
    max_per_user = db.Column(db.Integer, default=1)
    expiry_date = db.Column(db.Date, nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    combo_id = db.Column(db.Integer, db.ForeignKey('combos.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user_bookings = db.relationship('UserBooking', backref='voucher', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "max_discount": self.max_discount,
            "min_booking_value": self.min_booking_value,
            "conditions": self.conditions,
            "total_quantity": self.total_quantity,
            "used_count": self.used_count,
            "max_per_user": self.max_per_user,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "event_id": self.event_id,
            "combo_id": self.combo_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
