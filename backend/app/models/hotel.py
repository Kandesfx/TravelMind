from datetime import datetime
from app.extensions import db


class Hotel(db.Model):
    __tablename__ = 'hotels'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(150), nullable=False, unique=True, index=True)
    hotel_type = db.Column(db.String(20), nullable=False, index=True)  # Resort Hotel / City Hotel
    location = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(5), nullable=False, default='PRT')
    description = db.Column(db.Text, nullable=True)
    short_description = db.Column(db.String(300), nullable=True)
    star_rating = db.Column(db.Integer, nullable=False, default=4)  # 1-5
    total_rooms = db.Column(db.Integer, nullable=False, default=0)
    amenities = db.Column(db.JSON, nullable=True)  # ["pool", "spa", "gym", "wifi", "parking", "restaurant"]
    images = db.Column(db.JSON, nullable=True)  # List of image URLs
    thumbnail = db.Column(db.String(255), nullable=True)
    check_in_time = db.Column(db.String(10), nullable=False, default='14:00')
    check_out_time = db.Column(db.String(10), nullable=False, default='12:00')
    cancellation_policy = db.Column(db.Text, nullable=True)
    contact_email = db.Column(db.String(120), nullable=True)
    contact_phone = db.Column(db.String(30), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Relationships
    rooms = db.relationship('Room', backref='hotel', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_rooms=False):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "hotel_type": self.hotel_type,
            "location": self.location,
            "city": self.city,
            "country": self.country,
            "description": self.description,
            "short_description": self.short_description,
            "star_rating": self.star_rating,
            "total_rooms": self.total_rooms,
            "amenities": self.amenities,
            "images": self.images,
            "thumbnail": self.thumbnail,
            "check_in_time": self.check_in_time,
            "check_out_time": self.check_out_time,
            "cancellation_policy": self.cancellation_policy,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_active": self.is_active,
            "display_order": self.display_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "min_price": None,
        }
        if self.rooms:
            active_rooms = [r for r in self.rooms if r.is_active]
            if active_rooms:
                data["min_price"] = min(r.base_price_per_night for r in active_rooms)
        if include_rooms:
            data["rooms"] = [r.to_dict() for r in self.rooms if r.is_active]
        return data
