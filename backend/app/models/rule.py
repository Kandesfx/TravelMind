from datetime import datetime
from app.extensions import db

class RuleConfig(db.Model):
    __tablename__ = 'rule_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    algorithm = db.Column(db.String(20), nullable=False) # apriori / fpgrowth
    min_support = db.Column(db.Float, nullable=False)
    min_confidence = db.Column(db.Float, nullable=False)
    min_lift = db.Column(db.Float, nullable=False)
    features_used = db.Column(db.JSON, nullable=False) # list of features
    only_successful = db.Column(db.Boolean, default=True)
    total_transactions = db.Column(db.Integer, default=0)
    total_rules_generated = db.Column(db.Integer, default=0)
    execution_time_seconds = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relationships
    rules = db.relationship('AssociationRule', backref='config', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "algorithm": self.algorithm,
            "min_support": self.min_support,
            "min_confidence": self.min_confidence,
            "min_lift": self.min_lift,
            "features_used": self.features_used,
            "only_successful": self.only_successful,
            "total_transactions": self.total_transactions,
            "total_rules_generated": self.total_rules_generated,
            "execution_time_seconds": self.execution_time_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "created_by": self.created_by
        }

class AssociationRule(db.Model):
    __tablename__ = 'association_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    config_id = db.Column(db.Integer, db.ForeignKey('rule_configs.id'), nullable=False)
    antecedent = db.Column(db.JSON, nullable=False) # e.g. ["Hotel_Resort", "Group_Family"]
    consequent = db.Column(db.JSON, nullable=False) # e.g. ["Meal_HB", "Parking_Yes"]
    support = db.Column(db.Float, nullable=False, index=True)
    confidence = db.Column(db.Float, nullable=False, index=True)
    lift = db.Column(db.Float, nullable=False, index=True)
    conviction = db.Column(db.Float, nullable=True)
    leverage = db.Column(db.Float, nullable=True)
    antecedent_support = db.Column(db.Float, nullable=True)
    consequent_support = db.Column(db.Float, nullable=True)
    rule_hash = db.Column(db.String(64), nullable=False, index=True) # Unique rule signature within DB
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to Combo (optional backref)
    combos = db.relationship('Combo', backref='source_rule', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "config_id": self.config_id,
            "antecedent": self.antecedent,
            "consequent": self.consequent,
            "support": self.support,
            "confidence": self.confidence,
            "lift": self.lift,
            "conviction": self.conviction,
            "leverage": self.leverage,
            "antecedent_support": self.antecedent_support,
            "consequent_support": self.consequent_support,
            "rule_hash": self.rule_hash,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
