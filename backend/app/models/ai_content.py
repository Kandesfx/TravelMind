from datetime import datetime
from app.extensions import db

class AIContent(db.Model):
    __tablename__ = 'ai_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    content_type = db.Column(db.String(30), nullable=False) # combo_desc / event_desc / banner_text / etc.
    target_type = db.Column(db.String(20), nullable=False) # combo / event / banner / voucher
    target_id = db.Column(db.Integer, nullable=True)
    
    # Explicit FKs to satisfy relationships in combos/events
    combo_id = db.Column(db.Integer, db.ForeignKey('combos.id'), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    
    template_id = db.Column(db.Integer, db.ForeignKey('ai_templates.id'), nullable=True)
    prompt_used = db.Column(db.Text, nullable=True)
    generated_text = db.Column(db.JSON, nullable=False) # dict containing different versions: {"v1": "...", "v2": "..."}
    selected_version = db.Column(db.Integer, default=1)
    edited_text = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='draft', index=True) # draft / pending / approved / published / rejected
    admin_note = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    published_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "content_type": self.content_type,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "combo_id": self.combo_id,
            "event_id": self.event_id,
            "template_id": self.template_id,
            "prompt_used": self.prompt_used,
            "generated_text": self.generated_text,
            "selected_version": self.selected_version,
            "edited_text": self.edited_text,
            "status": self.status,
            "admin_note": self.admin_note,
            "reviewed_by": self.reviewed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None
        }
