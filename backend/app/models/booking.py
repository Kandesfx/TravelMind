from app.extensions import db

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    hotel = db.Column(db.String(20), index=True)
    is_canceled = db.Column(db.Integer, index=True)
    lead_time = db.Column(db.Integer)
    arrival_date_year = db.Column(db.Integer)
    arrival_date_month = db.Column(db.String(20), index=True)
    arrival_date_week_number = db.Column(db.Integer)
    arrival_date_day_of_month = db.Column(db.Integer)
    stays_in_weekend_nights = db.Column(db.Integer)
    stays_in_week_nights = db.Column(db.Integer)
    adults = db.Column(db.Integer)
    children = db.Column(db.Integer)
    babies = db.Column(db.Integer)
    meal = db.Column(db.String(10), index=True)
    country = db.Column(db.String(5), index=True)
    market_segment = db.Column(db.String(20))
    distribution_channel = db.Column(db.String(20))
    is_repeated_guest = db.Column(db.Integer)
    previous_cancellations = db.Column(db.Integer)
    previous_bookings_not_canceled = db.Column(db.Integer)
    reserved_room_type = db.Column(db.String(5))
    assigned_room_type = db.Column(db.String(5))
    booking_changes = db.Column(db.Integer)
    deposit_type = db.Column(db.String(20))
    agent = db.Column(db.Integer)
    days_in_waiting_list = db.Column(db.Integer)
    customer_type = db.Column(db.String(20), index=True)
    adr = db.Column(db.Float)
    required_car_parking_spaces = db.Column(db.Integer)
    total_of_special_requests = db.Column(db.Integer)
    reservation_status = db.Column(db.String(20))
    reservation_status_date = db.Column(db.String(20))  # stored as string for easier querying
    
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
