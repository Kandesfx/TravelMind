from datetime import datetime
from app.extensions import db

class Promotion(db.Model):
    __tablename__ = 'promotions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    discount_type = db.Column(db.String(20), nullable=False) # percent / fixed / free_service
    discount_value = db.Column(db.Float, default=0.0)
    apply_to = db.Column(db.String(50), nullable=True) # e.g. "Meal_HB", "Parking"
    conditions = db.Column(db.JSON, nullable=True) # e.g. {"hotel": "Resort", "group": "Family"}
    target_segment = db.Column(db.JSON, nullable=True) # target user segments list
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    source_insight = db.Column(db.Text, nullable=True) # Reason why it was created from rules/patterns
    expected_revenue = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "apply_to": self.apply_to,
            "conditions": self.conditions,
            "target_segment": self.target_segment,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "source_insight": self.source_insight,
            "expected_revenue": self.expected_revenue,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
