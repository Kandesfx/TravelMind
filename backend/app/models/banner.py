from datetime import datetime
from app.extensions import db

class Banner(db.Model):
    __tablename__ = 'banners'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    subtitle = db.Column(db.String(200), nullable=True)
    cta_text = db.Column(db.String(50), nullable=True)
    cta_link = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    position = db.Column(db.String(20), nullable=False, default='hero') # hero / sidebar / popup / footer
    display_order = db.Column(db.Integer, default=0)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    combo_id = db.Column(db.Integer, db.ForeignKey('combos.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    ai_media = db.relationship('AIMedia', backref='banner', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "cta_text": self.cta_text,
            "cta_link": self.cta_link,
            "image_url": self.image_url,
            "position": self.position,
            "display_order": self.display_order,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "event_id": self.event_id,
            "combo_id": self.combo_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
