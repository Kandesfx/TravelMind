from datetime import datetime
from app.extensions import db

class DataSource(db.Model):
    __tablename__ = 'data_sources'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    source_type = db.Column(db.String(10), nullable=False) # csv / web / manual
    file_path = db.Column(db.String(255), nullable=True)
    total_records = db.Column(db.Integer, default=0)
    valid_records = db.Column(db.Integer, default=0)
    date_range_start = db.Column(db.Date, nullable=True)
    date_range_end = db.Column(db.Date, nullable=True)
    is_included_in_mining = db.Column(db.Boolean, default=True, index=True)
    imported_at = db.Column(db.DateTime, default=datetime.utcnow)
    imported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "source_type": self.source_type,
            "file_path": self.file_path,
            "total_records": self.total_records,
            "valid_records": self.valid_records,
            "date_range_start": self.date_range_start.isoformat() if self.date_range_start else None,
            "date_range_end": self.date_range_end.isoformat() if self.date_range_end else None,
            "is_included_in_mining": self.is_included_in_mining,
            "imported_at": self.imported_at.isoformat() if self.imported_at else None,
            "imported_by": self.imported_by
        }
