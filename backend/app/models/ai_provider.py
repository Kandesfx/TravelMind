from datetime import datetime
from app.extensions import db

class AIProvider(db.Model):
    __tablename__ = 'ai_providers'
    
    id = db.Column(db.Integer, primary_key=True)
    service_type = db.Column(db.String(20), nullable=False) # text / image / video
    provider_name = db.Column(db.String(50), nullable=False) # gemini / openai / stability / ffmpeg
    api_key_encrypted = db.Column(db.Text, nullable=True) # encrypted with AES-256
    model_name = db.Column(db.String(100), nullable=True)
    endpoint_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    monthly_limit_usd = db.Column(db.Float, default=10.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    usage_logs = db.relationship('AIUsageLog', backref='provider', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "service_type": self.service_type,
            "provider_name": self.provider_name,
            # Do NOT return the key, not even the encrypted key for security
            "model_name": self.model_name,
            "endpoint_url": self.endpoint_url,
            "is_active": self.is_active,
            "monthly_limit_usd": self.monthly_limit_usd,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
