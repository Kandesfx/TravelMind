import sys
import io
from pathlib import Path
from datetime import datetime, date, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path to import app
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app import create_app
from app.extensions import db
from app.models import (
    User, AITemplate, Event, Combo, Voucher, Banner, AIProvider
)

def seed_data():
    app = create_app()
    with app.app_context():
        print("Đang chạy seed dữ liệu...")
        
        # 1. Seed Admin User
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("Đạo tài khoản admin mặc định: admin/admin123...")
            admin = User(
                username='admin',
                email='admin@travelmind.vn',
                full_name='TravelMind Administrator',
                role='admin',
                is_active=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Đã tạo admin thành công.")
        else:
            print("Tài khoản admin đã tồn tại.")
            
        # 2. Seed AI Providers
        if AIProvider.query.count() == 0:
            print("Đang seed danh sách AI Providers...")
            providers = [
                AIProvider(
                    service_type="text",
                    provider_name="gemini",
                    model_name="gemini-2.0-flash",
                    is_active=True,
                    monthly_limit_usd=20.0
                ),
                AIProvider(
                    service_type="image",
                    provider_name="stability",
                    model_name="stable-diffusion-xl",
                    is_active=True,
                    monthly_limit_usd=15.0
                ),
                AIProvider(
                    service_type="video",
                    provider_name="ffmpeg",
                    model_name="local-ffmpeg",
                    is_active=True,
                    monthly_limit_usd=0.0
                )
            ]
            db.session.bulk_save_objects(providers)
            db.session.commit()
            print("Đã seed AI Providers.")
            
        # 3. Seed AI Templates
        if AITemplate.query.count() == 0:
            print("Đang seed danh sách AI Templates...")
            templates = [
                AITemplate(
                    name="Mô tả Combo Du Lịch Thân Thiện",
                    content_type="combo_desc",
                    language="vi",
                    prompt_template="""Hãy viết một bài giới thiệu quảng cáo hấp dẫn, lôi cuốn bằng tiếng Việt cho gói combo du lịch '{combo_name}'. 
Gói này bao gồm các dịch vụ: {services}. 
Đối tượng khách hàng mục tiêu là: {target_group}. 
Thời gian thích hợp là: {target_season}.
Gợi ý mức giá khoảng: {price_estimate} USD/đêm và có mức giảm giá {discount_percent}%.
Hãy viết bài theo giọng điệu thân thiện, ấm cúng và truyền cảm hứng du lịch. Xuất ra dưới dạng JSON với các trường:
- title: Tiêu đề quảng cáo hấp dẫn
- short_desc: Đoạn mô tả ngắn (khoảng 2 câu)
- full_desc: Bài viết mô tả chi tiết đầy đủ (khoảng 2-3 đoạn văn)
- highlights: Mảng gồm 3-4 điểm nổi bật nhất của combo này""",
                    variables=["combo_name", "services", "target_group", "target_season", "price_estimate", "discount_percent"],
                    tone="friendly"
                ),
                AITemplate(
                    name="Mô tả Sự Kiện Mùa Vụ",
                    content_type="event_desc",
                    language="vi",
                    prompt_template="""Hãy viết bài giới thiệu chi tiết cho sự kiện khuyến mãi du lịch '{event_name}'. 
Sự kiện diễn ra từ ngày {start_date} đến {end_date}. 
Đối tượng khách hàng hướng tới: {target_audience}.
Hãy nhấn mạnh tính độc đáo của sự kiện và khuyến khích khách hàng đặt phòng sớm. Giọng điệu chuyên nghiệp, hào hứng. 
Xuất ra dưới dạng JSON với các trường:
- title: Tên chiến dịch truyền cảm hứng
- short_desc: Mô tả ngắn gọn
- full_desc: Bài viết đầy đủ""",
                    variables=["event_name", "start_date", "end_date", "target_audience"],
                    tone="professional"
                )
            ]
            db.session.bulk_save_objects(templates)
            db.session.commit()
            print("Đã seed AI Templates.")
            
        # 4. Seed Marketing Events
        if Event.query.count() == 0:
            print("Đang seed sự kiện marketing mẫu...")
            events = [
                Event(
                    name="Summer Family Fest 2026",
                    slug="summer-family-fest-2026",
                    description="Đại hội du lịch hè dành riêng cho các gia đình. Giảm giá phòng resort và miễn phí dịch vụ đi kèm như ăn uống trọn gói và đỗ xe.",
                    start_date=date(2026, 6, 1),
                    end_date=date(2026, 8, 31),
                    target_audience=["Family", "Couple"]
                ),
                Event(
                    name="Autumn Romance Getaway",
                    slug="autumn-romance-getaway",
                    description="Mùa thu lãng mạn dành cho các cặp đôi. Hưởng thụ không gian yên bình tại Resort với bữa ăn tối nửa buổi (Half Board) và ưu đãi nâng cấp phòng.",
                    start_date=date(2026, 9, 1),
                    end_date=date(2026, 11, 30),
                    target_audience=["Couple", "Solo"]
                ),
                Event(
                    name="Winter Business Express",
                    slug="winter-business-express",
                    description="Chiến dịch tối ưu cho khách đi công tác mùa đông tại trung tâm thành phố. Hỗ trợ đặt phòng City Hotel với giá tốt nhất, kèm bữa sáng nhanh gọn.",
                    start_date=date(2026, 12, 1),
                    end_date=date(2027, 2, 28),
                    target_audience=["Business", "Solo"]
                )
            ]
            db.session.bulk_save_objects(events)
            db.session.commit()
            print("Đã seed Events.")
            
        # 5. Seed Combos
        if Combo.query.count() == 0:
            print("Đang seed combo mẫu...")
            # Fetch events
            summer_event = Event.query.filter_by(slug="summer-family-fest-2026").first()
            autumn_event = Event.query.filter_by(slug="autumn-romance-getaway").first()
            winter_event = Event.query.filter_by(slug="winter-business-express").first()
            
            combos = [
                Combo(
                    name="Kỳ Nghỉ Hè Gia Đình Trọn Vẹn",
                    slug="family-summer-pack",
                    short_description="Trải nghiệm tuyệt vời tại Resort hạng sang kèm bữa ăn Half Board và chỗ đỗ xe miễn phí cho gia đình du ngoạn hè.",
                    full_description="Gói combo du lịch gia đình rực rỡ nhất mùa hè này! Nghỉ ngơi tại Resort Hotel lộng gió, thưởng thức bữa ăn Half Board tiện lợi (bao gồm buffet sáng và một bữa tối tự chọn), cùng chỗ đỗ xe hoàn toàn miễn phí. Combo được xây dựng từ mẫu hành vi của 72% nhóm gia đình thực tế.",
                    services=["Resort", "HB", "Room_D", "Parking"],
                    match_confidence=0.72,
                    match_lift=2.45,
                    price_estimate=130.0,
                    discount_percent=10.0,
                    discount_description="Giảm 10% tổng giá trị đặt phòng Resort và miễn phí 100% chi phí đỗ xe.",
                    target_group="Family",
                    target_season="Summer",
                    event_id=summer_event.id if summer_event else None,
                    image_url="/static/uploads/combo_family_summer.jpg",
                    is_active=True,
                    display_order=1,
                    total_bookings=128
                ),
                Combo(
                    name="Kỳ Nghỉ Lãng Mạn Mùa Thu",
                    slug="romantic-autumn-getaway",
                    short_description="Hòa mình vào không khí mùa thu yên bình tại Resort dành cho cặp đôi, bao gồm bữa ăn Full Board trọn gói.",
                    full_description="Kỳ nghỉ lãng mạn dành riêng cho hai người! Trải nghiệm 3 bữa ăn thượng hạng Full Board tại Resort Hotel cao cấp, tận hưởng tiết trời mùa thu dịu mát. Thích hợp cho các cặp đôi muốn có thời gian riêng tư thư giãn trọn vẹn.",
                    services=["Resort", "FB", "Room_E", "NoDeposit"],
                    match_confidence=0.63,
                    match_lift=1.92,
                    price_estimate=175.0,
                    discount_percent=15.0,
                    discount_description="Giảm 15% gói ăn uống trọn gói và tặng kèm rượu vang khi nhận phòng.",
                    target_group="Couple",
                    target_season="Autumn",
                    event_id=autumn_event.id if autumn_event else None,
                    image_url="/static/uploads/combo_romantic_autumn.jpg",
                    is_active=True,
                    display_order=2,
                    total_bookings=84
                ),
                Combo(
                    name="Công Tác Express Đô Thị",
                    slug="city-business-express",
                    short_description="Giải pháp tối ưu cho khách solo đi công tác tại khách sạn trung tâm thành phố kèm bữa sáng nhanh gọn.",
                    full_description="Gói dịch vụ tinh giản cho du khách đi công tác hoặc khách đi lẻ. Nghỉ ngơi tại City Hotel sầm uất với loại phòng tiêu chuẩn Room A, kèm bữa sáng nhanh gọn Bed & Breakfast. Không cần đặt cọc trước, đặt phòng nhanh chóng tiện lợi.",
                    services=["City", "BB", "Room_A", "NoDeposit"],
                    match_confidence=0.68,
                    match_lift=1.82,
                    price_estimate=95.0,
                    discount_percent=5.0,
                    discount_description="Giảm 5% giá phòng tiêu chuẩn và tích lũy điểm thưởng thành viên gấp đôi.",
                    target_group="Solo",
                    target_season="Winter",
                    event_id=winter_event.id if winter_event else None,
                    image_url="/static/uploads/combo_business_city.jpg",
                    is_active=True,
                    display_order=3,
                    total_bookings=215
                )
            ]
            db.session.bulk_save_objects(combos)
            db.session.commit()
            print("Đã seed Combos.")
            
        # 6. Seed Vouchers
        if Voucher.query.count() == 0:
            print("Đang seed voucher mẫu...")
            summer_event = Event.query.filter_by(slug="summer-family-fest-2026").first()
            autumn_event = Event.query.filter_by(slug="autumn-romance-getaway").first()
            
            vouchers = [
                Voucher(
                    code="SUMMER2026",
                    description="Giảm 10% cho tất cả booking đặt phòng mùa hè Resort.",
                    discount_type="percent",
                    discount_value=10.0,
                    max_discount=50.0,
                    min_booking_value=100.0,
                    conditions={"hotel_type": "Resort Hotel"},
                    total_quantity=200,
                    expiry_date=date(2026, 8, 31),
                    event_id=summer_event.id if summer_event else None,
                    is_active=True
                ),
                Voucher(
                    code="ROMANCE2026",
                    description="Giảm giá trực tiếp 20 USD cho các gói đặt phòng cặp đôi tại resort mùa thu.",
                    discount_type="fixed",
                    discount_value=20.0,
                    min_booking_value=150.0,
                    conditions={"hotel_type": "Resort Hotel", "adults": 2},
                    total_quantity=100,
                    expiry_date=date(2026, 11, 30),
                    event_id=autumn_event.id if autumn_event else None,
                    is_active=True
                )
            ]
            db.session.bulk_save_objects(vouchers)
            db.session.commit()
            print("Đã seed Vouchers.")
            
        # 7. Seed Banners
        if Banner.query.count() == 0:
            print("Đang seed banner mẫu...")
            summer_event = Event.query.filter_by(slug="summer-family-fest-2026").first()
            
            banners = [
                Banner(
                    title="Summer Family Fest 2026",
                    subtitle="Chào hè rực rỡ cùng gia đình - Ưu đãi giảm đến 15% tất cả các dịch vụ Resort Hotel!",
                    cta_text="Khám Phá Hè",
                    cta_link="/events/summer-family-fest-2026",
                    image_url="/static/uploads/banner_summer.jpg",
                    position="hero",
                    display_order=1,
                    start_date=date(2026, 6, 1),
                    end_date=date(2026, 8, 31),
                    event_id=summer_event.id if summer_event else None,
                    is_active=True
                )
            ]
            db.session.bulk_save_objects(banners)
            db.session.commit()
            print("Đã seed Banners.")
            
        print("Đã hoàn tất seed dữ liệu thành công!")

if __name__ == '__main__':
    seed_data()
