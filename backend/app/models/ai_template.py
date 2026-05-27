from datetime import datetime
from app.extensions import db

class AITemplate(db.Model):
    __tablename__ = 'ai_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    content_type = db.Column(db.String(30), nullable=False) # e.g. "combo_desc", "event_desc"
    language = db.Column(db.String(5), nullable=False, default='vi') # vi / en
    prompt_template = db.Column(db.Text, nullable=False) # e.g. "Hãy viết mô tả cho combo {combo_name}..."
    variables = db.Column(db.JSON, nullable=True) # list of variable names: ["combo_name", "services"]
    tone = db.Column(db.String(20), nullable=False, default='friendly') # friendly / professional / luxury
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    ai_contents = db.relationship('AIContent', backref='template', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "content_type": self.content_type,
            "language": self.language,
            "prompt_template": self.prompt_template,
            "variables": self.variables,
            "tone": self.tone,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
