# 🔌 API Reference — TravelMind

> Tài liệu tham chiếu tất cả API endpoints của hệ thống. Tổng cộng 50+ endpoints, chia theo module.
>
> **Kiến trúc Decoupled:** Backend Flask chạy trên `localhost:5000`, Frontend React SPA chạy trên `localhost:5173`.
> Vite dev server tự động proxy mọi request `/api/*` sang backend — không xảy ra lỗi CORS trong môi trường dev.

---

## Quy ước chung

| Thuộc tính | Giá trị |
|---|---|
| Base URL | `http://localhost:5000/api` |
| Format | JSON |
| Auth | Session-based (HTTPOnly Cookie — `credentials: 'include'` trên React fetch/axios) |
| CORS | Đã cấu hình Flask-CORS cho phép origin `http://localhost:5173` kèm credentials |
| Error format | `{"error": "message", "code": 400}` |

> [!IMPORTANT]
> **Cookie Authentication trong mô hình Decoupled:**
> React SPA phải luôn gửi kèm cookie khi gọi API:
> ```javascript
> // fetch API
> fetch('/api/auth/me', { credentials: 'include' })
>
> // axios (cấu hình global)
> axios.defaults.withCredentials = true;
> ```
> Flask backend cần đã cấu hình `CORS(app, supports_credentials=True, origins=['http://localhost:5173'])`.

**Mã trạng thái:**

| Code | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Request không hợp lệ |
| 401 | Chưa đăng nhập |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 500 | Lỗi server |

---

## 1. 🔐 Authentication

### POST `/api/auth/register`

Đăng ký tài khoản mới.

**Auth:** Public

```json
// Request
{
  "username": "traveler01",
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "password": "securepass123",
  "confirm_password": "securepass123"
}

// Response 201
{
  "id": 1,
  "username": "traveler01",
  "email": "user@example.com",
  "role": "user",
  "message": "Đăng ký thành công"
}
```

---

### POST `/api/auth/login`

Đăng nhập.

**Auth:** Public

```json
// Request
{
  "username": "traveler01",
  "password": "securepass123",
  "remember_me": true
}

// Response 200
{
  "id": 1,
  "username": "traveler01",
  "role": "user",
  "message": "Đăng nhập thành công"
}
```

---

### POST `/api/auth/logout`

Đăng xuất.

**Auth:** User/Admin

```json
// Response 200
{ "message": "Đã đăng xuất" }
```

---

### GET `/api/auth/me`

Lấy thông tin người dùng hiện tại.

**Auth:** User/Admin

```json
// Response 200
{
  "id": 1,
  "username": "traveler01",
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "role": "user",
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

## 2. 🌐 Public API

### GET `/api/hotels`

Danh sách khách sạn với thống kê.

**Auth:** Public

```json
// Response 200
{
  "hotels": [
    {
      "type": "Resort Hotel",
      "total_bookings": 40060,
      "percentage": 33.6,
      "avg_adr": 95.0,
      "cancel_rate": 27.8,
      "top_meal": "BB",
      "top_room": "A",
      "peak_months": ["July", "August"],
      "top_countries": ["PRT", "GBR", "DEU"]
    },
    {
      "type": "City Hotel",
      "total_bookings": 79330,
      "percentage": 66.4,
      "avg_adr": 105.3,
      "cancel_rate": 41.7,
      "top_meal": "BB",
      "top_room": "A",
      "peak_months": ["April", "May", "October"],
      "top_countries": ["PRT", "FRA", "DEU"]
    }
  ]
}
```

---

### GET `/api/combos`

Danh sách combo đang hoạt động.

**Auth:** Public

**Query params:** `?sort=lift|confidence|price` `&hotel_type=Resort` `&season=Summer` `&limit=10`

```json
// Response 200
{
  "combos": [
    {
      "id": 1,
      "name": "Kỳ Nghỉ Hè Gia Đình Trọn Vẹn",
      "slug": "family-summer-pack",
      "short_description": "Combo được 72% gia đình yêu thích",
      "services": ["Resort", "HB", "Room_D", "Parking"],
      "target_group": "Family",
      "target_season": "Summer",
      "match_confidence": 0.72,
      "match_lift": 2.1,
      "price_estimate": 130.0,
      "discount_percent": 10,
      "image_url": "/static/uploads/combo_1.jpg"
    }
  ],
  "total": 15
}
```

---

### GET `/api/combos/:id`

Chi tiết 1 combo.

**Auth:** Public

```json
// Response 200
{
  "id": 1,
  "name": "Kỳ Nghỉ Hè Gia Đình Trọn Vẹn",
  "full_description": "Đưa cả gia đình đến Resort nghỉ dưỡng...",
  "services": ["Resort", "HB", "Room_D", "Parking"],
  "source_rule": {
    "antecedent": ["Hotel_Resort", "Group_Family", "Season_Summer"],
    "consequent": ["Meal_HB", "Room_D", "Parking_Yes"],
    "support": 0.08,
    "confidence": 0.72,
    "lift": 2.1
  },
  "price_estimate": 130.0,
  "discount_percent": 10,
  "event": { "id": 1, "name": "Summer Fest 2026" },
  "related_vouchers": [
    { "code": "SUMMER2026", "discount": "15%", "expiry": "2026-08-31" }
  ]
}
```

---

### POST `/api/combos/recommend` ⭐

Gợi ý combo — **CORE API**.

**Auth:** Public

```json
// Request
{
  "hotel_type": "Resort",
  "group": "Family",
  "season": "Summer",
  "budget": "Mid"
}

// Response 200
{
  "recommendations": [
    {
      "rank": 1,
      "combo": {
        "name": "Kỳ Nghỉ Hè Gia Đình Trọn Vẹn",
        "services": ["Resort", "HB", "Room_D", "Parking"],
        "description": "72% gia đình nghỉ Resort mùa hè đã chọn combo này..."
      },
      "match_score": 1.512,
      "confidence": 0.72,
      "lift": 2.1,
      "support": 0.08,
      "price_estimate": 130.0
    },
    {
      "rank": 2,
      "combo": { "name": "Tiết Kiệm Gia Đình", "..." : "..." },
      "match_score": 1.044,
      "confidence": 0.58,
      "lift": 1.8
    },
    {
      "rank": 3,
      "combo": { "name": "Premium Family Resort", "..." : "..." },
      "match_score": 0.945,
      "confidence": 0.45,
      "lift": 2.1
    }
  ],
  "total_rules_matched": 12,
  "input": { "hotel_type": "Resort", "group": "Family", "season": "Summer", "budget": "Mid" }
}
```

---

### POST `/api/quiz/submit`

Nộp quiz → nhận persona + combo gợi ý.

**Auth:** Public (optional user)

```json
// Request
{ "answers": { "q1": "c", "q2": "d", "q3": "a", "q4": "c", "q5": "c" } }

// Response 200
{
  "persona": {
    "type": "family",
    "name": "👨‍👩‍👧‍👦 Family Traveler",
    "description": "Bạn là người yêu gia đình, luôn lên kế hoạch kỹ lưỡng...",
    "percentage": 32
  },
  "recommended_combo": {
    "id": 1,
    "name": "Family Summer Pack",
    "match_confidence": 0.72
  }
}
```

---

### GET `/api/insights/trends`

Dữ liệu xu hướng theo mùa.

**Auth:** Public

```json
// Response 200
{
  "monthly_bookings": [
    { "month": "January", "resort": 1200, "city": 2800, "avg_adr": 78.5 },
    { "month": "February", "resort": 1100, "city": 2650, "avg_adr": 80.2 },
    "..."
  ],
  "seasonality": {
    "peak": ["July", "August"],
    "low": ["January", "February", "November"],
    "best_value": ["January", "February", "March"]
  }
}
```

---

### GET `/api/insights/countries`

Phân bố quốc gia khách.

**Auth:** Public

```json
// Response 200
{
  "countries": [
    { "code": "PRT", "name": "Portugal", "count": 48590, "percentage": 40.7 },
    { "code": "GBR", "name": "United Kingdom", "count": 12129, "percentage": 10.2 },
    "..."
  ],
  "total_countries": 178
}
```

---

### GET `/api/events`

Sự kiện đang/sắp diễn ra.

**Auth:** Public

```json
// Response 200
{
  "events": [
    {
      "id": 1,
      "name": "Summer Family Fest 2026",
      "slug": "summer-family-fest-2026",
      "description": "Chào đón mùa hè rực rỡ...",
      "start_date": "2026-06-01",
      "end_date": "2026-08-31",
      "combos_count": 3,
      "vouchers_count": 2,
      "is_active": true
    }
  ]
}
```

---

### POST `/api/bookings`

Tạo booking (demo).

**Auth:** User

```json
// Request — thu thập đủ 15 features cho tái phân tích
{
  "combo_id": 1,
  "hotel_type": "Resort Hotel",
  "check_in": "2026-07-15",
  "check_out": "2026-07-20",
  "adults": 2,
  "children": 2,
  "babies": 0,
  "meal": "HB",
  "room_type": "D",
  "country": "VNM",
  "deposit_type": "No Deposit",
  "required_car_parking_spaces": 1,
  "total_of_special_requests": 2,
  "voucher_code": "SUMMER2026"
}
// Các trường tự tính bởi backend:
// - lead_time = (check_in - now).days
// - adr = total_price / nights
// - stays_in_weekend_nights / stays_in_week_nights (từ dates)
// - market_segment = "Direct" (web booking)
// - customer_type = "Transient"
// - is_repeated_guest = check user history

// Response 201
{
  "booking_id": 42,
  "status": "confirmed",
  "total_price": 585.0,
  "discount_applied": 65.0,
  "computed_fields": {
    "lead_time": 52,
    "adr": 117.0,
    "stays_in_weekend_nights": 2,
    "stays_in_week_nights": 3,
    "is_repeated_guest": 0
  },
  "message": "Đặt phòng thành công! Dữ liệu sẵn sàng cho tái phân tích."
}
```

---

### POST `/api/vouchers/validate`

Kiểm tra mã voucher.

**Auth:** Public

```json
// Request
{ "code": "SUMMER2026", "combo_id": 1, "total_price": 650 }

// Response 200
{
  "valid": true,
  "discount_type": "percent",
  "discount_value": 15,
  "discount_amount": 97.5,
  "final_price": 552.5,
  "message": "Giảm 15%, tiết kiệm $97.5!"
}
```

---

## 3. 🔒 Admin — Data & Mining

### GET `/api/admin/dashboard`

KPI tổng quan.

**Auth:** Admin

```json
// Response 200
{
  "kpis": {
    "total_bookings": 119390,
    "cancel_rate": 37.0,
    "avg_adr": 101.83,
    "total_countries": 178
  },
  "charts": {
    "monthly_revenue": [ ... ],
    "channel_distribution": [ ... ],
    "seasonal_occupancy": [ ... ],
    "top_countries": [ ... ]
  }
}
```

---

### GET `/api/admin/bookings`

Duyệt dữ liệu booking (phân trang).

**Auth:** Admin

**Query:** `?page=1&per_page=50&hotel=Resort&month=July&meal=HB&search=PRT`

```json
// Response 200
{
  "bookings": [ ... ],
  "total": 119390,
  "page": 1,
  "per_page": 50,
  "total_pages": 2388
}
```

---

### POST `/api/admin/rules/run`

Chạy thuật toán Association Rules.

**Auth:** Admin

```json
// Request
{
  "algorithm": "fpgrowth",
  "min_support": 0.05,
  "min_confidence": 0.50,
  "min_lift": 1.20,
  "features": ["Hotel_Type","Meal_Type","Room_Type","Season","Group_Size","Price_Range","Parking"],
  "only_successful": true
}

// Response 200
{
  "config_id": 5,
  "algorithm": "fpgrowth",
  "total_transactions": 75166,
  "total_rules": 47,
  "execution_time_seconds": 3.2,
  "top_rules": [
    {
      "id": 101,
      "antecedent": ["Hotel_Resort", "Group_Family", "Season_Summer"],
      "consequent": ["Meal_HB", "Parking_Yes"],
      "support": 0.08,
      "confidence": 0.72,
      "lift": 2.1
    }
  ]
}
```

---

### GET `/api/admin/rules`

Danh sách luật kết hợp.

**Auth:** Admin

**Query:** `?config_id=5&min_confidence=0.6&sort=lift&limit=20`

---

### GET `/api/admin/customers/segments`

Phân khúc khách hàng.

**Auth:** Admin

```json
// Response 200
{
  "segments": [
    {
      "name": "Family",
      "percentage": 32,
      "count": 24053,
      "characteristics": {
        "lead_time_avg": 85,
        "hotel_preference": "Resort",
        "meal_preference": "HB",
        "season_preference": "Summer",
        "avg_adr": 130
      }
    },
    "..."
  ]
}
```

---

## 4. 🔒 Admin — Business (CRUD)

> Tất cả CRUD endpoints theo pattern chung:

| Method | URL | Mô tả |
|---|---|---|
| GET | `/api/admin/{resource}` | Danh sách (phân trang, lọc) |
| GET | `/api/admin/{resource}/:id` | Chi tiết |
| POST | `/api/admin/{resource}` | Tạo mới |
| PUT | `/api/admin/{resource}/:id` | Cập nhật |
| DELETE | `/api/admin/{resource}/:id` | Xóa |

**Resources:** `combos`, `promotions`, `events`, `banners`, `vouchers`

---

### GET `/api/admin/reports/combos`

Báo cáo hiệu quả combo.

**Auth:** Admin

```json
// Response 200
{
  "combos": [
    {
      "id": 1,
      "name": "Family Summer Pack",
      "views": 1250,
      "bookings": 127,
      "conversion_rate": 10.2,
      "revenue": 16510
    }
  ]
}
```

---

## 5. 🔒 Admin — AI

### POST `/api/admin/ai/content/generate`

Tạo nội dung bằng AI.

**Auth:** Admin

```json
// Request
{
  "content_type": "combo_description",
  "target_id": 1,
  "template_id": 1,
  "tone": "friendly",
  "language": "vi",
  "num_versions": 3
}

// Response 200
{
  "content_id": 47,
  "status": "draft",
  "versions": [
    {
      "version": 1,
      "title": "Kỳ Nghỉ Hè Gia Đình Trọn Vẹn",
      "short_desc": "Tận hưởng mùa hè bên gia đình...",
      "full_desc": "Đưa cả gia đình đến Resort nghỉ dưỡng...",
      "highlights": ["Half Board", "Phòng loại D", "Đỗ xe miễn phí"]
    },
    { "version": 2, "..." : "..." },
    { "version": 3, "..." : "..." }
  ],
  "tokens_used": 850,
  "cost_usd": 0.003
}
```

---

### POST `/api/admin/ai/content/:id/review`

Duyệt nội dung AI.

**Auth:** Admin

```json
// Request
{
  "action": "approve",
  "selected_version": 1,
  "edited_content": {
    "title": "Kỳ Nghỉ Hè Gia Đình Trọn Vẹn (đã sửa)"
  },
  "admin_note": "OK, đăng luôn"
}

// Response 200
{
  "content_id": 47,
  "status": "approved",
  "message": "Nội dung đã được duyệt"
}
```

---

### POST `/api/admin/ai/media/generate-image`

Tạo ảnh bằng AI.

**Auth:** Admin

```json
// Request
{
  "prompt": "A luxurious tropical resort with a family enjoying breakfast...",
  "style": "photography",
  "aspect_ratio": "16:9",
  "num_images": 4,
  "target_type": "banner",
  "target_id": 1
}

// Response 200
{
  "images": [
    { "id": 1, "url": "/static/uploads/ai_img_001.png", "dimensions": "1920x1080" },
    { "id": 2, "url": "/static/uploads/ai_img_002.png", "dimensions": "1920x1080" },
    { "id": 3, "url": "/static/uploads/ai_img_003.png", "dimensions": "1920x1080" },
    { "id": 4, "url": "/static/uploads/ai_img_004.png", "dimensions": "1920x1080" }
  ],
  "credits_used": 4,
  "cost_usd": 0.04
}
```

---

### POST `/api/admin/ai/media/generate-video`

Tạo video slideshow.

**Auth:** Admin

```json
// Request
{
  "image_ids": [1, 2, 3],
  "texts": ["Hè Vui Cùng Cả Nhà", "Resort + Full Board", "Combo từ $117/đêm"],
  "template": "slideshow",
  "duration": 15,
  "music": "tropical_vibes",
  "aspect_ratio": "16:9",
  "transition": "fade"
}

// Response 200
{
  "video_id": 7,
  "url": "/static/uploads/ai_video_007.mp4",
  "duration": 15,
  "size_mb": 4.2,
  "status": "draft"
}
```

---

## 6. 🔒 Admin — Settings

### GET/POST `/api/admin/settings/ai-providers`

Quản lý API key.

**Auth:** Admin

```json
// POST Request (lưu/cập nhật key)
{
  "service_type": "text",
  "provider_name": "gemini",
  "api_key": "AIzaSy...dKw",
  "model_name": "gemini-2.0-flash",
  "monthly_limit_usd": 10.00
}

// Response 200
{
  "id": 1,
  "service_type": "text",
  "provider_name": "gemini",
  "model_name": "gemini-2.0-flash",
  "is_active": true,
  "status": "connected",
  "message": "Lưu thành công, kết nối OK"
}
```

---

### POST `/api/admin/settings/ai-providers/:id/test`

Test kết nối AI provider.

**Auth:** Admin

```json
// Response 200
{
  "status": "ok",
  "model": "gemini-2.0-flash",
  "response_time_ms": 342,
  "remaining_credits": 1847200
}
```

---

### GET `/api/admin/settings/ai-usage`

Thống kê sử dụng AI.

**Auth:** Admin

**Query:** `?month=2026-06`

```json
// Response 200
{
  "period": "2026-06",
  "text": { "requests": 45, "tokens": 152800, "cost_usd": 0.46 },
  "image": { "requests": 63, "credits": 63, "cost_usd": 0.63 },
  "video": { "requests": 5, "credits": 0, "cost_usd": 0.00 },
  "total_cost_usd": 1.09,
  "monthly_limit_usd": 10.00,
  "percent_used": 10.9,
  "daily_breakdown": [ ... ]
}
```

---

## Tổng Kết API

| Module | Endpoints | Auth |
|---|---|---|
| Auth | 4 | Public / User |
| Public | 11 | Public |
| Admin - Data | 4 | Admin |
| Admin - Mining | 4 | Admin |
| Admin - Business | 25+ (CRUD × 5) + 2 reports | Admin |
| Admin - AI | 8 | Admin |
| Admin - Settings | 3 | Admin |
| **Tổng** | **~55 endpoints** | |

---

> [!NOTE]
> **Tài liệu liên quan:**
> - Đặc tả chức năng → [06_dac_ta_chuc_nang.md](./06_dac_ta_chuc_nang.md)
> - Database Schema → [05_database.md](./05_database.md)
> - Kiến trúc hệ thống Decoupled → [04_kien_truc_he_thong.md](./04_kien_truc_he_thong.md)
> - Routes Flask tại: `backend/app/routes/`
> - API caller service tại: `frontend/src/services/`
