"""
Survey 2 datasets: Expedia & Hotel Bookings
Goal: Compare actual row-level data, assess if they can be combined.
"""
import pandas as pd
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 80)
print("KHAO SAT THUC TE 2 BO DU LIEU")
print("=" * 80)

# ===== 1. READ DATA =====
print("\n[1] DOC DU LIEU")
print("-" * 40)

hb = pd.read_csv(r"d:\Hai\study\KPDL\DAMH\hotel_bookings.csv\hotel_bookings.csv")
print(f"Hotel Bookings: {hb.shape[0]:,} dong x {hb.shape[1]} cot")

exp = pd.read_csv(r"d:\Hai\study\KPDL\DAMH\expedia-hotel-recommendations\train.csv", nrows=500_000)
print(f"Expedia (mau 500K): {exp.shape[0]:,} dong x {exp.shape[1]} cot")

# ===== 2. ACTUAL ROW SAMPLES =====
print("\n" + "=" * 80)
print("[2] MAU DU LIEU THUC TE - TUNG DONG")
print("=" * 80)

print("\n--- HOTEL BOOKINGS: 3 dong dau ---")
print(hb.head(3).to_string())

print("\n--- EXPEDIA: 3 dong dau ---")
print(exp.head(3).to_string())

# ===== 3. COLUMN LIST =====
print("\n" + "=" * 80)
print("[3] SO SANH CAC COT")
print("=" * 80)

print(f"\n--- Hotel Bookings ({hb.shape[1]} cot) ---")
for i, col in enumerate(hb.columns):
    dtype = hb[col].dtype
    sample = hb[col].dropna().iloc[0] if len(hb[col].dropna()) > 0 else "NULL"
    nunique = hb[col].nunique()
    print(f"  {i+1:2}. {col:40} | type: {str(dtype):10} | sample: {str(sample):20} | {nunique:,} unique values")

print(f"\n--- Expedia ({exp.shape[1]} cot) ---")
for i, col in enumerate(exp.columns):
    dtype = exp[col].dtype
    sample = exp[col].dropna().iloc[0] if len(exp[col].dropna()) > 0 else "NULL"
    nunique = exp[col].nunique()
    print(f"  {i+1:2}. {col:40} | type: {str(dtype):10} | sample: {str(sample):20} | {nunique:,} unique values")

# ===== 4. COMMON / SIMILAR COLUMNS =====
print("\n" + "=" * 80)
print("[4] CAC COT TUONG DONG GIUA 2 BO")
print("=" * 80)

comparisons = [
    ("Loai khach san",
     "hotel (Resort Hotel / City Hotel)",
     "KHONG CO (chi co hotel_cluster = ma so 0-99)"),
    ("Ngay check-in",
     "arrival_date_year + month + day",
     "srch_ci (ngay tim kiem check-in)"),
    ("Ngay check-out",
     "Tinh tu arrival_date + stays_nights",
     "srch_co (ngay tim kiem check-out)"),
    ("So nguoi lon",
     "adults (so thuc: 2, 1, 3...)",
     "srch_adults_cnt (so thuc: 2, 1, 3...)"),
    ("So tre em",
     "children + babies",
     "srch_children_cnt"),
    ("Quoc gia khach",
     "country (ma ISO: PRT, GBR, FRA...)",
     "user_location_country (ma so: 66, 205... KHONG BIET ten)"),
    ("Kenh dat phong",
     "market_segment (Online TA, Direct, Corporate...)",
     "channel (ma so: 1, 2, 3, 9... KHONG BIET ten)"),
    ("Loai bua an",
     "meal (BB, HB, FB, SC)",
     "KHONG CO"),
    ("Loai phong",
     "reserved_room_type (A, B, C, D...)",
     "KHONG CO"),
    ("Dat coc",
     "deposit_type (No Deposit, Non Refund...)",
     "KHONG CO"),
    ("Gia phong",
     "adr (gia trung binh/dem bang so: 75, 98...)",
     "KHONG CO"),
    ("Goi dich vu (package)",
     "KHONG CO",
     "is_package (0/1)"),
    ("Mobile/Desktop",
     "KHONG CO",
     "is_mobile (0/1)"),
    ("Click hay Dat that",
     "KHONG CO (chi co booking that)",
     "is_booking (0=click, 1=dat)"),
    ("Yeu cau dac biet",
     "total_of_special_requests (0, 1, 2...)",
     "KHONG CO"),
    ("Do xe",
     "required_car_parking_spaces (0, 1...)",
     "KHONG CO"),
]

for feature, hb_val, exp_val in comparisons:
    print(f"\n  {feature}:")
    print(f"     HB:  {hb_val}")
    print(f"     EXP: {exp_val}")

# ===== 5. ACTUAL VALUES COMPARISON =====
print("\n" + "=" * 80)
print("[5] SO SANH GIA TRI THUC TE O CAC COT TUONG DONG")
print("=" * 80)

print("\n--- So nguoi lon ---")
print(f"  Hotel Bookings (adults):")
print(f"    {hb['adults'].value_counts().head(6).to_string()}")
print(f"  Expedia (srch_adults_cnt):")
print(f"    {exp['srch_adults_cnt'].value_counts().head(6).to_string()}")

print("\n--- So tre em ---")
print(f"  Hotel Bookings (children):")
print(f"    {hb['children'].value_counts().head(6).to_string()}")
print(f"  Expedia (srch_children_cnt):")
print(f"    {exp['srch_children_cnt'].value_counts().head(6).to_string()}")

print("\n--- Quoc gia ---")
print(f"  Hotel Bookings (country) - TOP 10:")
print(f"    {hb['country'].value_counts().head(10).to_string()}")
print(f"  Expedia (user_location_country) - TOP 10:")
print(f"    {exp['user_location_country'].value_counts().head(10).to_string()}")

print("\n--- Kenh dat phong ---")
print(f"  Hotel Bookings (market_segment):")
print(f"    {hb['market_segment'].value_counts().to_string()}")
print(f"  Expedia (channel):")
print(f"    {exp['channel'].value_counts().to_string()}")

# ===== 6. TIME RANGE =====
print("\n--- Pham vi thoi gian ---")
hb_years = sorted(hb['arrival_date_year'].unique())
print(f"  Hotel Bookings: nam {hb_years}")
exp_dates = pd.to_datetime(exp['date_time'])
print(f"  Expedia: tu {exp_dates.min()} den {exp_dates.max()}")

# ===== 7. CORE ISSUE =====
print("\n" + "=" * 80)
print("[6] VAN DE COT LOI: HE MA HOA KHAC NHAU")
print("=" * 80)

print("""
  Hotel Bookings dung TEN THAT:
    country = "PRT" (Portugal), "GBR" (UK), "FRA" (France)
    market_segment = "Online TA", "Direct", "Corporate"
    meal = "BB" (Bed & Breakfast), "HB" (Half Board)
    hotel = "Resort Hotel", "City Hotel"

  Expedia dung MA SO (khong biet nghia):
    user_location_country = 66, 205, 69 (khong biet 66 la nuoc nao)
    channel = 1, 2, 3, 9 (khong biet 9 la kenh gi)
    hotel_cluster = 0-99 (khong biet cluster 5 la loai gi)

  => KHONG the "dich" ma so Expedia sang ten that Hotel Bookings
  => KHONG the JOIN 2 bang theo bat ky cot nao
""")

# ===== 8. HOTEL BOOKINGS DETAIL =====
print("=" * 80)
print("[7] CHI TIET HOTEL BOOKINGS (dataset chinh cho Association Rules)")
print("=" * 80)

print("\n--- Missing Values ---")
missing_hb = hb.isnull().sum()
missing_hb = missing_hb[missing_hb > 0]
if len(missing_hb) > 0:
    for col, count in missing_hb.items():
        pct = count / len(hb) * 100
        print(f"  {col}: {count:,} dong thieu ({pct:.2f}%)")
else:
    print("  Khong co missing values")

# Check for 'NULL' strings
for col in hb.columns:
    null_str = (hb[col] == 'NULL').sum()
    if null_str > 0:
        print(f"  {col}: {null_str:,} dong co gia tri 'NULL' (chuoi)")

print(f"\n--- Ty le huy ---")
cancel_rate = hb['is_canceled'].mean() * 100
print(f"  Da huy: {cancel_rate:.1f}% ({hb['is_canceled'].sum():,} / {len(hb):,})")
print(f"  Thanh cong: {100-cancel_rate:.1f}% ({(~hb['is_canceled'].astype(bool)).sum():,})")

print(f"\n--- Phan bo loai khach san ---")
print(f"  {hb['hotel'].value_counts().to_string()}")

print(f"\n--- Phan bo bua an ---")
print(f"  {hb['meal'].value_counts().to_string()}")

print(f"\n--- Phan bo loai phong ---")
print(f"  {hb['reserved_room_type'].value_counts().to_string()}")

print(f"\n--- Phan bo customer_type ---")
print(f"  {hb['customer_type'].value_counts().to_string()}")

print(f"\n--- Phan bo deposit_type ---")
print(f"  {hb['deposit_type'].value_counts().to_string()}")

print(f"\n--- Thong ke gia (adr) ---")
print(f"  {hb['adr'].describe().to_string()}")

print(f"\n--- Phan bo special requests ---")
print(f"  {hb['total_of_special_requests'].value_counts().sort_index().to_string()}")

print(f"\n--- Phan bo parking ---")
print(f"  {hb['required_car_parking_spaces'].value_counts().sort_index().to_string()}")

# ===== 9. EXPEDIA DETAIL =====
print("\n" + "=" * 80)
print("[8] CHI TIET EXPEDIA")
print("=" * 80)

print(f"\n--- Ty le click vs booking ---")
booking_rate = exp['is_booking'].mean() * 100
print(f"  Booking: {booking_rate:.1f}%")
print(f"  Click (chi xem): {100-booking_rate:.1f}%")

print(f"\n--- Ty le package ---")
package_rate = exp['is_package'].mean() * 100
print(f"  Package (goi dich vu): {package_rate:.1f}%")
print(f"  Non-package: {100-package_rate:.1f}%")

print(f"\n--- Top 10 hotel_cluster ---")
print(f"  {exp['hotel_cluster'].value_counts().head(10).to_string()}")

print(f"\n--- Mobile vs Desktop ---")
mobile_rate = exp['is_mobile'].mean() * 100
print(f"  Mobile: {mobile_rate:.1f}%")
print(f"  Desktop: {100-mobile_rate:.1f}%")

print(f"\n--- Missing values ---")
missing_exp = exp.isnull().sum()
missing_exp = missing_exp[missing_exp > 0]
for col, count in missing_exp.items():
    pct = count / len(exp) * 100
    print(f"  {col}: {count:,} dong thieu ({pct:.2f}%)")

# ===== 10. FINAL SUMMARY =====
print("\n" + "=" * 80)
print("[9] KET LUAN CUOI CUNG")
print("=" * 80)

print("""
  =====================================================================
  CAN 2 BO DU LIEU NAY CO THE KET HOP THANH 1 KHONG?
  =====================================================================

  KIEM TRA 1 - Cung nguon du lieu?
    => KHONG. Hotel Bookings tu 2 khach san o Bo Dao Nha.
       Expedia tu nen tang dat phong toan cau.

  KIEM TRA 2 - Co cot khoa chung de JOIN?
    => KHONG. Khong co user_id, booking_id, hay hotel_id chung.

  KIEM TRA 3 - He ma hoa tuong thich?
    => KHONG. HB dung ten that (PRT, BB, Resort Hotel).
       Expedia dung ma so (66, 9, cluster 5).

  KIEM TRA 4 - Pham vi thoi gian trung nhau?
    => CO PHAN. HB: 2015-2017. Expedia: 2013-2014.
       Nhung khong giup gi vi khong co cot lien ket.

  KIEM TRA 5 - Pham vi dia ly trung nhau?
    => KHONG RO. HB la khach san Bo Dao Nha.
       Expedia la toan cau nhung khong biet cu the.

  =====================================================================
  KET LUAN: KHONG THE KET HOP (MERGE/JOIN) 2 BO DU LIEU
  =====================================================================

  => PHUONG AN TOT NHAT: Chon 1 bo lam CHINH

  PHUONG AN A - Hotel Bookings lam chinh (KHUYEN NGHI):
    + Du lieu ro rang, dien giai duoc
    + Phu hop cho Association Rules
    + 119K dong, du lon cho do an
    + Co the tao combo du lich thuc te

  PHUONG AN B - Expedia lam chinh:
    + Du lieu lon, an tuong
    - Phai doi huong: dung Classification thay Association Rules
    - Ket qua kho dien giai (ma so)
    - Can sampling vi qua lon

  PHUONG AN C - Dung ca 2 nhung RIENG BIET:
    - Hai phan tich doc lap, khong lien ket
    - Co the bi danh gia la roi rac
    - Can ly do tot de giai thich
""")
