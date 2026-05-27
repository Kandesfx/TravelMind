import os
import sys
import io
import pandas as pd
from pathlib import Path
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path to import app
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app import create_app
from app.extensions import db
from app.models.booking import Booking
from app.models.data_source import DataSource

def import_csv_data():
    app = create_app()
    with app.app_context():
        # Check if already imported
        existing_count = Booking.query.count()
        if existing_count > 0:
            print(f"Bảng bookings đã có {existing_count:,} bản ghi. Bỏ qua import.")
            return
            
        csv_path = Path(__file__).resolve().parent.parent / 'data' / 'raw' / 'hotel_bookings.csv'
        # Fallback if raw file not copied there yet
        alternative_path = Path("d:/Hai/study/KPDL/DAMH/hotel_bookings.csv/hotel_bookings.csv")
        
        if not csv_path.exists():
            if alternative_path.exists():
                print(f"Sao chép file từ {alternative_path} sang {csv_path}")
                os.makedirs(csv_path.parent, exist_ok=True)
                import shutil
                shutil.copy(alternative_path, csv_path)
            else:
                print(f"LỖI: Không tìm thấy file CSV tại {csv_path} hoặc {alternative_path}")
                sys.exit(1)
                
        print("Đang đọc file CSV...")
        df = pd.read_csv(csv_path)
        print(f"Đọc thành công: {df.shape[0]:,} dòng x {df.shape[1]} cột")
        
        # Drop company column if present in df (as it's not in the SQLAlchemy Model)
        if 'company' in df.columns:
            df.drop(columns=['company'], inplace=True)
            
        # Clean numeric NaNs to avoid DB issues
        df['agent'] = df['agent'].fillna(0).astype(int)
        df['children'] = df['children'].fillna(0).astype(int)
        df['babies'] = df['babies'].fillna(0).astype(int)
        
        print("Đang import dữ liệu vào SQLite (sử dụng to_sql)...")
        # Increase SQLite speed
        db.session.execute(db.text("PRAGMA synchronous = OFF"))
        db.session.execute(db.text("PRAGMA journal_mode = MEMORY"))
        
        # We drop index and set it from 1 to be cleaner
        df.index = df.index + 1
        
        # Write to SQL
        df.to_sql('bookings', con=db.engine, if_exists='append', index=True, index_label='id')
        db.session.commit()
        
        # Create DataSource entry
        print("Đang tạo thông tin nguồn dữ liệu (DataSource)...")
        
        # Calculate date ranges
        # Month mapping to parse dates
        months_map = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        
        # Let's approximate min/max date
        min_year = int(df['arrival_date_year'].min())
        max_year = int(df['arrival_date_year'].max())
        
        start_date = datetime(min_year, 7, 1).date() # Dataset starts from July 2015
        end_date = datetime(max_year, 8, 31).date() # Dataset ends in Aug 2017
        
        # Get count of successful bookings (is_canceled == 0)
        valid_recs = int((df['is_canceled'] == 0).sum())
        
        ds = DataSource(
            name="Hotel Bookings CSV (Original)",
            source_type="csv",
            file_path=str(csv_path),
            total_records=df.shape[0],
            valid_records=valid_recs,
            date_range_start=start_date,
            date_range_end=end_date,
            is_included_in_mining=True
        )
        db.session.add(ds)
        db.session.commit()
        
        print(f"Hoàn thành import! Tổng cộng: {Booking.query.count():,} bản ghi.")

if __name__ == '__main__':
    import_csv_data()
