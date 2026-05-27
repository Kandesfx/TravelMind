from datetime import datetime
from app.extensions import db

class AIMedia(db.Model):
    __tablename__ = 'ai_media'
    
    id = db.Column(db.Integer, primary_key=True)
    media_type = db.Column(db.String(10), nullable=False) # image / video
    prompt_used = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(255), nullable=True)
    file_size_bytes = db.Column(db.Integer, default=0)
    dimensions = db.Column(db.String(20), nullable=True) # e.g. "1920x1080"
    duration_seconds = db.Column(db.Integer, default=0) # for videos
    style = db.Column(db.String(20), nullable=True) # photography / illustration / etc.
    aspect_ratio = db.Column(db.String(10), nullable=True) # 16:9 / 1:1
    provider_used = db.Column(db.String(50), nullable=True)
    
    target_type = db.Column(db.String(20), nullable=False) # combo / event / banner
    target_id = db.Column(db.Integer, nullable=True)
    
    # Explicit FK columns to link to related models
    combo_id = db.Column(db.Integer, db.ForeignKey('combos.id'), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    banner_id = db.Column(db.Integer, db.ForeignKey('banners.id'), nullable=True)
    
    status = db.Column(db.String(20), nullable=False, default='draft', index=True) # draft / approved / in_use
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "media_type": self.media_type,
            "prompt_used": self.prompt_used,
            "file_url": self.file_url,
            "thumbnail_url": self.thumbnail_url,
            "file_size_bytes": self.file_size_bytes,
            "dimensions": self.dimensions,
            "duration_seconds": self.duration_seconds,
            "style": self.style,
            "aspect_ratio": self.aspect_ratio,
            "provider_used": self.provider_used,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "combo_id": self.combo_id,
            "event_id": self.event_id,
            "banner_id": self.banner_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
