from datetime import datetime
from app.extensions import db

class Combo(db.Model):
    __tablename__ = 'combos'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    short_description = db.Column(db.Text, nullable=True)
    full_description = db.Column(db.Text, nullable=True)
    services = db.Column(db.JSON, nullable=False) # list of items, e.g. ["Resort", "HB", "Room_D", "Parking"]
    source_rule_id = db.Column(db.Integer, db.ForeignKey('association_rules.id'), nullable=True)
    match_confidence = db.Column(db.Float, default=0.0)
    match_lift = db.Column(db.Float, default=0.0)
    price_estimate = db.Column(db.Float, default=0.0)
    discount_percent = db.Column(db.Float, default=0.0)
    discount_description = db.Column(db.Text, nullable=True)
    target_group = db.Column(db.String(20), index=True) # Solo / Couple / Family / Large
    target_season = db.Column(db.String(20), index=True) # Spring / Summer / Autumn / Winter
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hotels.id'), nullable=True)
    room_ids = db.Column(db.JSON, nullable=True) # list of room IDs compatible with this combo
    is_active = db.Column(db.Boolean, default=True, index=True)
    display_order = db.Column(db.Integer, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    user_bookings = db.relationship('UserBooking', backref='combo', lazy=True)
    banners = db.relationship('Banner', backref='combo', lazy=True)
    vouchers = db.relationship('Voucher', backref='combo', lazy=True)
    ai_contents = db.relationship('AIContent', backref='combo', lazy=True)
    ai_media = db.relationship('AIMedia', backref='combo', lazy=True)
    hotel_ref = db.relationship('Hotel', foreign_keys=[hotel_id], lazy='select')
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "short_description": self.short_description,
            "full_description": self.full_description,
            "services": self.services,
            "source_rule_id": self.source_rule_id,
            "match_confidence": self.match_confidence,
            "match_lift": self.match_lift,
            "price_estimate": self.price_estimate,
            "discount_percent": self.discount_percent,
            "discount_description": self.discount_description,
            "target_group": self.target_group,
            "target_season": self.target_season,
            "event_id": self.event_id,
            "image_url": self.image_url,
            "hotel_id": self.hotel_id,
            "room_ids": self.room_ids,
            "is_active": self.is_active,
            "display_order": self.display_order,
            "total_bookings": self.total_bookings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
