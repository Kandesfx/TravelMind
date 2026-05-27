from datetime import datetime
from app.extensions import db

class AIUsageLog(db.Model):
    __tablename__ = 'ai_usage_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('ai_providers.id'), nullable=False)
    content_type = db.Column(db.String(30), nullable=False) # e.g. "combo_desc", "image_gen"
    tokens_used = db.Column(db.Integer, default=0)
    credits_used = db.Column(db.Float, default=0.0)
    cost_usd = db.Column(db.Float, default=0.0)
    request_payload = db.Column(db.Text, nullable=True) # Summary of request payload
    response_time_ms = db.Column(db.Integer, default=0)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "content_type": self.content_type,
            "tokens_used": self.tokens_used,
            "credits_used": self.credits_used,
            "cost_usd": self.cost_usd,
            "request_payload": self.request_payload,
            "response_time_ms": self.response_time_ms,
            "admin_id": self.admin_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
