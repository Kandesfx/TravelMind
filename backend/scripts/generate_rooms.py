"""
generate_rooms.py — Sinh dữ liệu khách sạn và phòng từ hotel_bookings.csv

Script này phân tích dữ liệu thực tế từ bộ dataset Hotel Booking Demand để:
1. Tính phân bố room_type theo hotel_type (Resort vs City)
2. Tính ADR trung bình, median cho từng (hotel_type, room_type)
3. Sinh 4 khách sạn cụ thể
4. Cho mỗi khách sạn, sinh phòng với giá và số lượng phản ánh dữ liệu thực
"""
import sys
import io
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import pandas as pd
import numpy as np

from app import create_app
from app.extensions import db
from app.models.hotel import Hotel
from app.models.room import Room


# ========================================
# Room type metadata (enriched from data)
# ========================================
ROOM_TYPE_METADATA = {
    'A': {
        'name_resort': 'Standard Garden Room',
        'name_city': 'Standard City Room',
        'short_desc_resort': 'Phòng tiêu chuẩn thoải mái với view vườn, phù hợp cho cặp đôi hoặc khách đi một mình.',
        'short_desc_city': 'Phòng tiêu chuẩn tiện nghi tại trung tâm thành phố, lý tưởng cho khách công tác.',
        'max_adults': 2, 'max_children': 1, 'max_occupancy': 3,
        'bed_type': 'Double', 'area_sqm': 25, 'floor_range': '1-3',
        'view_resort': 'Garden', 'view_city': 'City',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar'],
        'display_order': 1
    },
    'B': {
        'name_resort': 'Superior Pool View',
        'name_city': 'Superior City View',
        'short_desc_resort': 'Phòng superior rộng rãi với tầm nhìn hồ bơi, nội thất hiện đại.',
        'short_desc_city': 'Phòng superior với tầm nhìn thành phố, không gian làm việc riêng.',
        'max_adults': 2, 'max_children': 1, 'max_occupancy': 3,
        'bed_type': 'Queen', 'area_sqm': 30, 'floor_range': '2-5',
        'view_resort': 'Pool', 'view_city': 'City',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'bathrobe'],
        'display_order': 2
    },
    'C': {
        'name_resort': 'Deluxe Ocean View',
        'name_city': 'Deluxe Premium Room',
        'short_desc_resort': 'Phòng deluxe sang trọng với ban công nhìn ra đại dương xanh thẳm.',
        'short_desc_city': 'Phòng deluxe cao cấp với tiện nghi đẳng cấp và không gian rộng rãi.',
        'max_adults': 2, 'max_children': 2, 'max_occupancy': 4,
        'bed_type': 'King', 'area_sqm': 35, 'floor_range': '3-6',
        'view_resort': 'Ocean', 'view_city': 'City Panorama',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'bathrobe', 'balcony', 'coffee_machine'],
        'display_order': 3
    },
    'D': {
        'name_resort': 'Junior Suite',
        'name_city': 'Business Suite',
        'short_desc_resort': 'Junior Suite thanh lịch với phòng khách riêng biệt, lý tưởng cho kỳ nghỉ thư giãn.',
        'short_desc_city': 'Business Suite với phòng họp mini và bàn làm việc riêng, hoàn hảo cho công tác.',
        'max_adults': 2, 'max_children': 2, 'max_occupancy': 4,
        'bed_type': 'King', 'area_sqm': 45, 'floor_range': '4-7',
        'view_resort': 'Ocean', 'view_city': 'City Panorama',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'bathrobe', 'balcony', 'coffee_machine', 'living_room', 'bathtub'],
        'display_order': 4
    },
    'E': {
        'name_resort': 'Executive Ocean Suite',
        'name_city': 'Executive Premium Suite',
        'short_desc_resort': 'Suite hạng Executive với tầm nhìn đại dương 180°, bồn tắm jacuzzi riêng.',
        'short_desc_city': 'Suite Executive với phòng khách rộng và dịch vụ quản gia 24/7.',
        'max_adults': 3, 'max_children': 2, 'max_occupancy': 5,
        'bed_type': 'King', 'area_sqm': 55, 'floor_range': '5-8',
        'view_resort': 'Ocean Panorama', 'view_city': 'City Skyline',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'bathrobe', 'balcony', 'coffee_machine', 'living_room', 'bathtub', 'jacuzzi', 'butler_service'],
        'display_order': 5
    },
    'F': {
        'name_resort': 'Family Beach Villa',
        'name_city': 'Family Apartment Suite',
        'short_desc_resort': 'Villa gia đình rộng rãi với lối ra biển riêng, 2 phòng ngủ, bếp nhỏ.',
        'short_desc_city': 'Căn hộ suite dành cho gia đình với 2 phòng ngủ, phòng bếp đầy đủ.',
        'max_adults': 4, 'max_children': 3, 'max_occupancy': 6,
        'bed_type': 'Multiple', 'area_sqm': 70, 'floor_range': '1-4',
        'view_resort': 'Beach', 'view_city': 'Park',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'kitchen', 'washing_machine', 'living_room', 'balcony', 'kids_amenities'],
        'display_order': 6
    },
    'G': {
        'name_resort': 'Presidential Ocean Villa',
        'name_city': 'Penthouse Suite',
        'short_desc_resort': 'Villa tổng thống với hồ bơi riêng, vườn nhiệt đới và butler 24/7.',
        'short_desc_city': 'Penthouse đỉnh cao sang trọng với ban công toàn cảnh thành phố.',
        'max_adults': 4, 'max_children': 2, 'max_occupancy': 6,
        'bed_type': 'King', 'area_sqm': 100, 'floor_range': '8-10',
        'view_resort': 'Ocean + Garden', 'view_city': 'City 360°',
        'amenities': ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'bathrobe', 'balcony', 'coffee_machine', 'living_room', 'bathtub', 'jacuzzi', 'butler_service', 'private_pool', 'dining_room'],
        'display_order': 7
    },
}

# Hotel definitions
HOTELS = [
    {
        'name': 'Algarve Seaside Resort & Spa',
        'slug': 'algarve-seaside-resort',
        'hotel_type': 'Resort Hotel',
        'location': 'Praia da Luz, Algarve',
        'city': 'Lagos',
        'country': 'PRT',
        'description': 'Nằm trên bờ biển Algarve tuyệt đẹp phía Nam Bồ Đào Nha, Algarve Seaside Resort & Spa mang đến trải nghiệm nghỉ dưỡng đẳng cấp với bãi biển riêng, hồ bơi vô cực nhìn ra Đại Tây Dương, spa chăm sóc sức khỏe toàn diện và nhà hàng hải sản tươi sống. Resort được bao quanh bởi vườn nhiệt đới xanh mát, là điểm đến lý tưởng cho gia đình và cặp đôi tìm kiếm sự thư giãn.',
        'short_description': 'Resort nghỉ dưỡng 5 sao bên bờ biển Algarve với spa cao cấp và bãi biển riêng.',
        'star_rating': 5,
        'amenities': ['beach', 'pool', 'spa', 'gym', 'wifi', 'parking', 'restaurant', 'bar', 'kids_club', 'tennis', 'water_sports'],
        'check_in_time': '15:00',
        'check_out_time': '11:00',
        'cancellation_policy': 'Miễn phí hủy trước 48 giờ. Hủy muộn sẽ tính phí 1 đêm đầu tiên.',
        'contact_email': 'reservations@algarve-resort.pt',
        'contact_phone': '+351 282 000 001',
        'latitude': 37.0833,
        'longitude': -8.7333,
        'display_order': 1,
    },
    {
        'name': 'Serra da Estrela Mountain Lodge',
        'slug': 'serra-mountain-lodge',
        'hotel_type': 'Resort Hotel',
        'location': 'Serra da Estrela Natural Park',
        'city': 'Covilhã',
        'country': 'PRT',
        'description': 'Ẩn mình trong dãy núi Serra da Estrela hùng vĩ, Mountain Lodge mang đến trải nghiệm nghỉ dưỡng giữa thiên nhiên hoang sơ. Với kiến trúc bằng đá granite truyền thống, lò sưởi ấm cúng, spa suối khoáng nóng thiên nhiên và nhà hàng phục vụ ẩm thực Bồ Đào Nha địa phương, nơi đây là thiên đường cho những ai yêu thích sự tĩnh lặng.',
        'short_description': 'Lodge nghỉ dưỡng 4 sao giữa núi Serra da Estrela với spa suối nóng thiên nhiên.',
        'star_rating': 4,
        'amenities': ['spa', 'gym', 'wifi', 'parking', 'restaurant', 'bar', 'hiking', 'fireplace_lounge', 'library'],
        'check_in_time': '14:00',
        'check_out_time': '12:00',
        'cancellation_policy': 'Miễn phí hủy trước 72 giờ. Mùa cao điểm yêu cầu đặt cọc 30%.',
        'contact_email': 'info@serra-lodge.pt',
        'contact_phone': '+351 275 000 002',
        'latitude': 40.3167,
        'longitude': -7.6000,
        'display_order': 2,
    },
    {
        'name': 'Lisboa Central Business Hotel',
        'slug': 'lisboa-central-hotel',
        'hotel_type': 'City Hotel',
        'location': 'Avenida da Liberdade, Baixa',
        'city': 'Lisboa',
        'country': 'PRT',
        'description': 'Tọa lạc ngay trên đại lộ Avenida da Liberdade — con phố sầm uất nhất thủ đô, Lisboa Central Business Hotel là lựa chọn hàng đầu cho khách công tác và du lịch khám phá thành phố. Thiết kế hiện đại kết hợp nét cổ kính Lisbon, trung tâm hội nghị chuyên nghiệp, nhà hàng rooftop với view toàn cảnh thành phố và kết nối giao thông thuận tiện tới mọi điểm tham quan.',
        'short_description': 'Khách sạn 4 sao trung tâm Lisbon trên Avenida da Liberdade, lý tưởng cho công tác.',
        'star_rating': 4,
        'amenities': ['wifi', 'parking', 'restaurant', 'bar', 'gym', 'business_center', 'conference_room', 'rooftop_bar', 'concierge', 'laundry'],
        'check_in_time': '14:00',
        'check_out_time': '12:00',
        'cancellation_policy': 'Miễn phí hủy trước 24 giờ. Đặt không hoàn hủy giảm thêm 10%.',
        'contact_email': 'booking@lisboa-central.pt',
        'contact_phone': '+351 21 000 003',
        'latitude': 38.7167,
        'longitude': -9.1500,
        'display_order': 3,
    },
    {
        'name': 'Porto Ribeira Heritage Hotel',
        'slug': 'porto-ribeira-hotel',
        'hotel_type': 'City Hotel',
        'location': 'Cais da Ribeira, UNESCO Heritage Zone',
        'city': 'Porto',
        'country': 'PRT',
        'description': 'Nằm trong khu phố cổ Ribeira — di sản UNESCO bên bờ sông Douro, Porto Heritage Hotel tái hiện vẻ đẹp lịch sử Porto trong không gian hiện đại. Từ ban công phòng, du khách có thể ngắm cầu Dom Luís I và những thuyền chở rượu vang Port truyền thống. Wine bar phục vụ bộ sưu tập Port wine từ các nhà sản xuất nổi tiếng nhất thung lũng Douro.',
        'short_description': 'Khách sạn boutique 4 sao tại khu di sản Ribeira, Porto với wine bar đặc sắc.',
        'star_rating': 4,
        'amenities': ['wifi', 'restaurant', 'bar', 'wine_bar', 'concierge', 'laundry', 'bicycle_rental', 'river_terrace', 'cultural_tours'],
        'check_in_time': '15:00',
        'check_out_time': '11:00',
        'cancellation_policy': 'Miễn phí hủy trước 48 giờ. Mùa lễ hội São João yêu cầu đặt cọc.',
        'contact_email': 'reservas@porto-ribeira.pt',
        'contact_phone': '+351 22 000 004',
        'latitude': 41.1400,
        'longitude': -8.6100,
        'display_order': 4,
    }
]

# Seasonal multipliers from actual monthly booking patterns
SEASONAL_MULTIPLIER = {
    "Spring": 1.0,   # Mar, Apr, May — shoulder season
    "Summer": 1.25,  # Jun, Jul, Aug — peak season
    "Autumn": 0.95,  # Sep, Oct, Nov — slightly off
    "Winter": 0.80,  # Dec, Jan, Feb — low season
}


def analyze_csv_data(csv_path: str) -> dict:
    """Analyze hotel_bookings.csv to extract real room type distributions and pricing."""
    print(f"Đang đọc dữ liệu từ {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"  Đã đọc {len(df):,} dòng.")

    # Filter only successful bookings
    df = df[df['is_canceled'] == 0].copy()
    # Remove invalid
    df = df[df['adr'] >= 0]
    df.loc[df['adr'] > 1000, 'adr'] = 1000.0
    df = df[(df['adults'] > 0) | (df['children'] > 0)]
    print(f"  Sau lọc: {len(df):,} đặt phòng thành công.")

    stats = {}

    for hotel_type in ['Resort Hotel', 'City Hotel']:
        ht_df = df[df['hotel'] == hotel_type]
        hotel_key = 'resort' if 'Resort' in hotel_type else 'city'
        stats[hotel_key] = {}

        for room_type in sorted(ht_df['reserved_room_type'].unique()):
            rt_df = ht_df[ht_df['reserved_room_type'] == room_type]
            if len(rt_df) < 10:
                continue

            stats[hotel_key][room_type] = {
                'count': len(rt_df),
                'pct': len(rt_df) / len(ht_df) * 100,
                'adr_mean': round(rt_df['adr'].mean(), 2),
                'adr_median': round(rt_df['adr'].median(), 2),
                'adr_q25': round(rt_df['adr'].quantile(0.25), 2),
                'adr_q75': round(rt_df['adr'].quantile(0.75), 2),
                'adr_min': round(rt_df['adr'].min(), 2),
                'adr_max': round(rt_df['adr'].max(), 2),
            }

    print("\n📊 Phân bố Room Type từ dữ liệu thực:")
    for hotel_key in ['resort', 'city']:
        print(f"\n  {'Resort Hotel' if hotel_key == 'resort' else 'City Hotel'}:")
        for rt, data in stats[hotel_key].items():
            print(f"    Room {rt}: {data['count']:,} ({data['pct']:.1f}%) | "
                  f"ADR mean={data['adr_mean']:.0f}€ median={data['adr_median']:.0f}€ "
                  f"[{data['adr_q25']:.0f} - {data['adr_q75']:.0f}]")

    return stats


def create_rooms_for_hotel(hotel: Hotel, stats: dict) -> list:
    """Generate Room objects for a hotel based on real data statistics."""
    hotel_key = 'resort' if 'Resort' in hotel.hotel_type else 'city'
    room_stats = stats.get(hotel_key, {})

    rooms = []
    total_room_count = 0

    for room_type, meta in ROOM_TYPE_METADATA.items():
        rt_stats = room_stats.get(room_type)
        if not rt_stats:
            # Room type not in data for this hotel type — skip rare types
            continue

        # Calculate inventory count proportionally
        # Scale: most popular type gets ~8-10 rooms, others proportionally
        pct = rt_stats['pct']
        if pct >= 50:
            inventory = 10
        elif pct >= 20:
            inventory = 7
        elif pct >= 10:
            inventory = 5
        elif pct >= 5:
            inventory = 4
        elif pct >= 2:
            inventory = 3
        else:
            inventory = 2

        # Use median ADR as base price (more robust than mean)
        base_price = rt_stats['adr_median']

        # Ensure minimum price makes sense
        if base_price < 30:
            base_price = 30.0

        # Weekend surcharge: ~10-15% of base price
        weekend_surcharge = round(base_price * 0.12, 2)

        # Choose name & metadata based on hotel type
        is_resort = 'Resort' in hotel.hotel_type
        name = meta['name_resort'] if is_resort else meta['name_city']
        short_desc = meta['short_desc_resort'] if is_resort else meta['short_desc_city']
        view = meta['view_resort'] if is_resort else meta['view_city']

        # Description
        description = (
            f"{short_desc} "
            f"Phòng rộng {meta['area_sqm']}m², tầng {meta['floor_range']}, "
            f"giường {meta['bed_type']}, tầm nhìn {view}. "
            f"Phù hợp tối đa {meta['max_adults']} người lớn và {meta['max_children']} trẻ em. "
            f"Giá cơ bản từ {base_price:.0f}€/đêm (thay đổi theo mùa)."
        )

        # Meal options
        meal_options = [
            {"type": "SC", "name": "Tự phục vụ", "price": 0},
            {"type": "BB", "name": "Bed & Breakfast", "price": round(base_price * 0.12, 2)},
            {"type": "HB", "name": "Half Board (Sáng + Tối)", "price": round(base_price * 0.25, 2)},
            {"type": "FB", "name": "Full Board (3 bữa)", "price": round(base_price * 0.38, 2)},
        ]

        slug = f"{hotel.slug}-{room_type.lower()}-{name.lower().replace(' ', '-').replace('&', 'and')}"

        room = Room(
            hotel_id=hotel.id,
            room_type=room_type,
            name=name,
            slug=slug,
            description=description,
            short_description=short_desc,
            max_adults=meta['max_adults'],
            max_children=meta['max_children'],
            max_occupancy=meta['max_occupancy'],
            bed_type=meta['bed_type'],
            area_sqm=meta['area_sqm'],
            floor_range=meta['floor_range'],
            view_type=view,
            base_price_per_night=base_price,
            weekend_surcharge=weekend_surcharge,
            seasonal_multiplier=SEASONAL_MULTIPLIER,
            total_inventory=inventory,
            available_count=inventory,
            amenities=meta['amenities'],
            images=[],
            thumbnail=None,
            meal_options=meal_options,
            is_active=True,
            display_order=meta['display_order']
        )
        rooms.append(room)
        total_room_count += inventory

    return rooms, total_room_count


def generate_all():
    """Main entry point: read CSV, create hotels + rooms in database."""
    csv_path = str(Path(__file__).resolve().parent.parent.parent / 'hotel_bookings.csv' / 'hotel_bookings.csv')

    # Analyze CSV data first
    stats = analyze_csv_data(csv_path)

    app = create_app()
    with app.app_context():
        # Check if hotels already exist
        if Hotel.query.count() > 0:
            print("\n⚠️  Đã có khách sạn trong database. Xóa và tạo lại...")
            Room.query.delete()
            Hotel.query.delete()
            db.session.commit()

        print("\n🏨 Đang tạo khách sạn...")
        for hotel_data in HOTELS:
            hotel = Hotel(**hotel_data)
            db.session.add(hotel)
            db.session.flush()  # Get hotel.id

            rooms, total = create_rooms_for_hotel(hotel, stats)
            hotel.total_rooms = total

            for room in rooms:
                db.session.add(room)

            print(f"  ✅ {hotel.name} ({hotel.hotel_type}) — {len(rooms)} loại phòng, {total} phòng tổng")

        db.session.commit()

        # Print summary
        total_hotels = Hotel.query.count()
        total_rooms = Room.query.count()
        print(f"\n🎉 Hoàn tất! Đã tạo {total_hotels} khách sạn với {total_rooms} loại phòng.")

        # Print detail
        for hotel in Hotel.query.all():
            print(f"\n  📍 {hotel.name} ({hotel.hotel_type})")
            for room in hotel.rooms:
                print(f"     Room {room.room_type} — {room.name}: {room.base_price_per_night:.0f}€/đêm "
                      f"x {room.total_inventory} phòng | {room.bed_type} | {room.area_sqm}m²")


if __name__ == '__main__':
    generate_all()
