from datetime import datetime
from app.extensions import db

class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # nullable for guest quiz
    answers = db.Column(db.JSON, nullable=False) # e.g. {"q1": "a", "q2": "c"}
    persona_type = db.Column(db.String(30), nullable=False) # planner / last_minute / business / romantic / family
    recommended_combo_id = db.Column(db.Integer, db.ForeignKey('combos.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to Combo
    recommended_combo = db.relationship('Combo', backref='quiz_results', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "answers": self.answers,
            "persona_type": self.persona_type,
            "recommended_combo_id": self.recommended_combo_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
