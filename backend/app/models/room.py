from datetime import datetime
from app.extensions import db


class Room(db.Model):
    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hotels.id'), nullable=False, index=True)
    room_type = db.Column(db.String(5), nullable=False, index=True)  # A, B, C, D, E, F, G, H
    name = db.Column(db.String(100), nullable=False)  # e.g. "Standard Double", "Deluxe Ocean View"
    slug = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    short_description = db.Column(db.String(300), nullable=True)

    # Capacity
    max_adults = db.Column(db.Integer, nullable=False, default=2)
    max_children = db.Column(db.Integer, nullable=False, default=1)
    max_occupancy = db.Column(db.Integer, nullable=False, default=3)

    # Physical attributes
    bed_type = db.Column(db.String(50), nullable=False, default='Double')  # Single, Double, Twin, King, Queen
    area_sqm = db.Column(db.Float, nullable=True)
    floor_range = db.Column(db.String(20), nullable=True)  # e.g. "1-3", "4-8"
    view_type = db.Column(db.String(50), nullable=True)  # Ocean, City, Garden, Mountain, Pool

    # Pricing — base price derived from real ADR data
    base_price_per_night = db.Column(db.Float, nullable=False, default=100.0)
    weekend_surcharge = db.Column(db.Float, nullable=False, default=0.0)  # Extra per night on weekends
    seasonal_multiplier = db.Column(db.JSON, nullable=True)  # {"Summer": 1.2, "Winter": 0.85, ...}

    # Inventory
    total_inventory = db.Column(db.Integer, nullable=False, default=5)  # Number of rooms of this type
    available_count = db.Column(db.Integer, nullable=False, default=5)  # Current available

    # Features
    amenities = db.Column(db.JSON, nullable=True)  # ["wifi", "minibar", "balcony", "safe", "bathtub"]
    images = db.Column(db.JSON, nullable=True)  # List of image URLs
    thumbnail = db.Column(db.String(255), nullable=True)

    # Meal options available for this room
    meal_options = db.Column(db.JSON, nullable=True)  # [{"type": "BB", "price": 0}, {"type": "HB", "price": 25}]

    is_active = db.Column(db.Boolean, default=True, index=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "hotel_id": self.hotel_id,
            "room_type": self.room_type,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "short_description": self.short_description,
            "max_adults": self.max_adults,
            "max_children": self.max_children,
            "max_occupancy": self.max_occupancy,
            "bed_type": self.bed_type,
            "area_sqm": self.area_sqm,
            "floor_range": self.floor_range,
            "view_type": self.view_type,
            "base_price_per_night": self.base_price_per_night,
            "weekend_surcharge": self.weekend_surcharge,
            "seasonal_multiplier": self.seasonal_multiplier,
            "total_inventory": self.total_inventory,
            "available_count": self.available_count,
            "amenities": self.amenities,
            "images": self.images,
            "thumbnail": self.thumbnail,
            "meal_options": self.meal_options,
            "is_active": self.is_active,
            "display_order": self.display_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "hotel_name": self.hotel.name if self.hotel else None,
            "hotel_type": self.hotel.hotel_type if self.hotel else None,
        }
