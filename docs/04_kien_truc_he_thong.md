# 📐 Kiến Trúc Hệ Thống TravelMind (Decoupled)

> Tài liệu mô tả kiến trúc tổng thể, các thành phần, luồng dữ liệu, phân chia thư mục và thiết kế kỹ thuật của hệ thống TravelMind theo mô hình decoupled (API Backend và SPA Frontend).

---

## 1. Tổng Quan Kiến Trúc

### 1.1 Sơ đồ kiến trúc tổng thể

```mermaid
flowchart TB
    subgraph CLIENT["⚛️ Frontend (React SPA on Vite)"]
        direction TB
        PUB["Public Pages\n(8 trang React)"]
        ADM["Admin Panel\n(18 trang React)"]
        AUTH_P["Auth Pages\n(2 trang React)"]
        STORE["React State / Context\n(Session, Auth, Cart)"]
    end

    subgraph API_LAYER["🔌 REST API Layer (Flask)"]
        direction LR
        AUTH_API["Auth API\nSession Cookie"]
        PUBLIC_API["Public API\nCombos, Quiz, Insights"]
        ADMIN_API["Admin API\nKPIs, Bookings, CRUD"]
        AI_API["AI API\nText, Image, Video Gen"]
    end

    subgraph SERVICES["⚙️ Backend Services (Python)"]
        direction TB
        AUTH_SVC["Auth\nService"]
        DATA_SVC["Data\nService"]
        MINING_SVC["Mining\nEngine (mlxtend)"]
        REC_SVC["Recommendation\nEngine (scoring)"]
        AI_SVC["AI Service\n(AES Key Decrypt)"]
    end

    subgraph DATA_LAYER["💾 Data Layer"]
        direction LR
        SQLITE["SQLite\n(travelmind.db)"]
        CSV["CSV/Parquet\n(data/processed/)"]
        FILES["File Storage\n(uploads/)"]
    end

    subgraph EXTERNAL["☁️ External Services"]
        direction LR
        LLM["Google Gemini\n(Text API)"]
        FFMPEG["FFmpeg Local\n(Video Subprocess)"]
    end

    CLIENT -->|JSON / Cookies| API_LAYER
    API_LAYER --> SERVICES
    SERVICES --> DATA_LAYER
    AI_SVC --> EXTERNAL
```

### 1.2 Kiến trúc phân lớp và phân vai công nghệ

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| **Presentation (Frontend)** | React 18, Vite, React Router, Plotly.js, Chart.js | Single Page Application, vẽ biểu đồ tương tác |
| **Styling (CSS)** | CSS Modules / Vanilla CSS | Xây dựng giao diện kính mờ (Glassmorphism), vi hoạt ảnh |
| **API Gateway (Backend)** | Flask, Flask-CORS, Flask-Login | Định tuyến, quản lý phiên qua cookie, kiểm tra quyền |
| **Business Logic** | Python modules (mlxtend, pandas, numpy) | Chạy Apriori/FP-Growth, tính toán score gợi ý |
| **Data Access** | SQLAlchemy 2.0 ORM | Truy xuất và cập nhật SQLite database |
| **Storage** | SQLite, File System | Lưu trữ thông tin nghiệp vụ và tệp tin media |
| **External APIs** | requests (Gemini API), subprocess (FFmpeg) | Sinh văn bản quảng cáo và ghép slideshow video |

---

## 2. Kiến Trúc Frontend (React SPA)

### 2.1 Công nghệ cốt lõi

- **Framework & Build tool:** React 18 + Vite (đảm bảo hot-reload cực nhanh và dung lượng build tối ưu).
- **Routing:** React Router v6 (quản lý URL, phân chia các route Công khai và Bảo mật Admin).
- **State Management:** React Context (quản lý trạng thái đăng nhập `AuthContext`, giỏ hàng hoặc thông tin combo).
- **Biểu đồ:** `react-chartjs-2` (cho Chart.js), `plotly.js-dist-min` (cho bản đồ và heatmap tương tác).
- **Styling:** CSS Modules giúp tránh chồng chéo class CSS, hỗ trợ hiệu ứng kính mờ (Glassmorphism) và dark-mode hiện đại.

### 2.2 Cấu trúc trang (28 trang)

```mermaid
graph TB
    subgraph PUBLIC["🌐 Public Pages (8 trang)"]
        P1["/ — Landing Page"]
        P2["/hotels — Hotel Explorer"]
        P3["/combo-builder — Smart Combo Builder ⭐"]
        P4["/quiz — Traveler Quiz"]
        P5["/booking — Booking Flow"]
        P6["/insights — Travel Insights"]
        P7["/events/:slug — Event Page"]
        P8["/profile — User Profile"]
    end

    subgraph ADMIN["🔒 Admin Panel (18 trang)"]
        A1["/admin — Dashboard KPI"]
        A2["/admin/combos — Quản lý Combo"]
        A3["/admin/promotions — Quản lý Ưu đãi"]
        A4["/admin/events — Quản lý Sự kiện"]
        A5["/admin/banners — Quản lý Banner"]
        A6["/admin/vouchers — Quản lý Voucher"]
        A7["/admin/reports — Báo cáo hiệu quả"]
        A8["/admin/customers — Phân tích KH"]
        A9["/admin/rules — Rules Lab"]
        A10["/admin/data — Quản lý dữ liệu"]
        A11["/admin/ai/content — AI Content Studio"]
        A12["/admin/ai/images — AI Image Studio"]
        A13["/admin/ai/videos — AI Video Studio"]
        A14["/admin/ai/media — Thư viện Media"]
        A15["/admin/ai/templates — Template AI"]
        A16["/admin/ai/history — Lịch sử kiểm duyệt"]
        A17["/admin/settings/api-keys — API Key Settings"]
        A18["/admin/settings/ai-usage — AI Usage Dashboard"]
    end

    subgraph AUTH_PAGES["🔐 Auth (2 trang)"]
        AU1["/login — Đăng nhập"]
        AU2["/register — Đăng ký"]
    end
```

---

## 3. Kiến Trúc Backend (Flask API Only)

### 3.1 Thiết kế API

Flask đóng vai trò là một **REST API Server** thuần túy:
- Không render giao diện qua Jinja2 templates.
- Trả về dữ liệu kiểu JSON cho mọi API.
- Cấu hình CORS để chấp nhận kết nối từ `http://localhost:5173` (Vite dev server) kèm theo cookie phiên (`credentials: 'include'`).

### 3.2 Luồng xử lý yêu cầu (CORS & Cookies)

```mermaid
sequenceDiagram
    participant C as React SPA (Browser)
    participant B as Flask API (Backend)
    participant A as Auth Session
    participant DB as SQLite DB

    C->>B: POST /api/auth/login (username, password)
    B->>DB: Kiểm tra tài khoản & verify hash
    DB-->>B: Hợp lệ
    B->>A: Tạo session & Set-Cookie (session_id)
    B-->>C: Response 200 (role: admin/user)
    
    Note over C,B: Các yêu cầu tiếp theo tự động mang theo cookie session
    
    C->>B: GET /api/admin/dashboard (Cookie)
    B->>B: Validate session cookie
    alt Session không hợp lệ hoặc thiếu
        B-->>C: Response 401 Unauthorized
    else Session hợp lệ
        B->>DB: Query các chỉ số KPI
        DB-->>B: KPI data
        B-->>C: Response 200 JSON
    end
```

---

## 4. Tích Hợp AI & Quản Lý Khóa API

### 4.1 Luồng sinh và duyệt nội dung AI (Moderation Workflow)

Tất cả văn bản được tạo bởi Gemini LLM hoặc hình ảnh được tạo từ Image Gen API đều đi qua hàng đợi duyệt trên database trước khi hiển thị phía công khai:

```mermaid
stateDiagram-v2
    [*] --> Draft: AI sinh nội dung nháp
    Draft --> Pending: Chờ Admin kiểm duyệt
    Pending --> Approved: Admin chỉnh sửa và duyệt
    Pending --> Rejected: Admin từ chối
    Approved --> Published: Xuất bản lên Web (Combo/Event hiển thị)
    Published --> [*]
    Rejected --> [*]
```

### 4.2 Bảo mật Khóa API
- Khóa API được Admin nhập trực tiếp trên trang `/admin/settings/api-keys`.
- Backend Flask dùng thư viện `cryptography` giải mã khóa `AI_ENCRYPTION_KEY` trong file `.env`, sau đó mã hóa khóa API của nhà cung cấp dưới thuật toán **AES-256 (Fernet)** trước khi ghi xuống bảng `ai_providers`.
- Khi thực hiện cuộc gọi API đến Gemini, backend giải mã tạm thời khóa trong bộ nhớ, thực hiện cuộc gọi, và lập tức xóa khóa khỏi memory.

---

## 5. Cấu Trúc Thư Mục Dự Án

```
DAMH/
├── backend/                      # 🔌 Flask Backend API
│   ├── app/
│   │   ├── __init__.py           # Khởi tạo App, CORS, Blueprints
│   │   ├── config.py             # Cấu hình app (Dev, Prod, SQLite path)
│   │   ├── extensions.py         # SQLAlchemy, LoginManager, CORS
│   │   │
│   │   ├── models/               # Các Model SQLAlchemy
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── booking.py
│   │   │   ├── user_booking.py   # Web bookings (27 cột)
│   │   │   ├── data_source.py
│   │   │   ├── rule.py           # configs & rules
│   │   │   ├── combo.py
│   │   │   ├── promotion.py
│   │   │   ├── event.py
│   │   │   ├── banner.py
│   │   │   ├── voucher.py
│   │   │   ├── ai_provider.py
│   │   │   ├── ai_content.py
│   │   │   ├── ai_media.py
│   │   │   ├── ai_template.py
│   │   │   ├── ai_usage.py
│   │   │   └── quiz_result.py
│   │   │
│   │   ├── routes/               # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── public.py
│   │   │   ├── admin_data.py
│   │   │   ├── admin_mining.py
│   │   │   ├── admin_business.py
│   │   │   ├── admin_ai.py
│   │   │   └── admin_settings.py
│   │   │
│   │   └── services/             # Core logic services
│   │       ├── __init__.py
│   │       ├── auth_service.py
│   │       ├── data_service.py
│   │       ├── mining_service.py
│   │       ├── recommendation_service.py
│   │       ├── ai_text_service.py
│   │       ├── ai_image_service.py
│   │       ├── ai_video_service.py
│   │       └── ai_key_service.py
│   │
│   ├── data/
│   │   ├── raw/                  # hotel_bookings.csv
│   │   └── processed/            # cleaned_bookings.csv, transactions.csv
│   │
│   ├── scripts/                  # Scripts khởi động và chạy nền
│   │   ├── import_data.py
│   │   ├── clean_data.py
│   │   ├── run_mining.py
│   │   └── seed_admin.py
│   │
│   ├── requirements.txt
│   ├── run.py                    # Chạy backend (localhost:5000)
│   └── .env
│
└── frontend/                     # ⚛️ React Frontend (Vite)
    ├── src/
    │   ├── assets/               # CSS global, ảnh nền, logo
    │   ├── components/           # UI components (GlassCard, Nav, Sidebar)
    │   ├── pages/                # 28 pages as React components
    │   │   ├── public/           # Landing, Explorer, Builder, Quiz, Booking, Insights
    │   │   ├── admin/            # Dashboard, CRUD managers, AI Studios, Settings
    │   │   └── auth/             # Login, Register
    │   ├── services/             # Axios/fetch API wrappers
    │   ├── styles/               # CSS Modules tương ứng cho từng component/page
    │   ├── App.jsx               # React Router & Context providers
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js            # Proxy `/api` -> `localhost:5000`
    └── index.html
```

---

## 6. Hướng Dẫn Triển Khai & Khởi Chạy

### 6.1 Yêu cầu hệ thống
- **Python:** 3.10+
- **Node.js:** 18+ (npm 9+)
- **FFmpeg:** Phải được cài đặt trên máy và thêm vào biến môi trường `PATH` (để chạy sinh video cục bộ).

### 6.2 Khởi chạy Backend
1. Di chuyển vào thư mục backend và cài đặt môi trường ảo:
   ```bash
   cd backend
   python -m venv venv
   # Kích hoạt trên Windows:
   venv\Scripts\activate
   # Kích hoạt trên macOS/Linux:
   source venv/bin/activate
   ```
2. Cài đặt các thư viện dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Tạo file cấu hình `.env` dựa trên file `.env.example` và thiết lập khóa mã hóa:
   ```env
   SECRET_KEY=yoursecretkey
   AI_ENCRYPTION_KEY=FernetKeyGeneratedBase64
   FLASK_ENV=development
   ```
4. Khởi chạy các script nạp và dọn dẹp dữ liệu ban đầu:
   ```bash
   python scripts/import_data.py
   python scripts/seed_admin.py
   ```
5. Chạy server Flask API:
   ```bash
   python run.py
   # Chạy trên cổng 5000
   ```

### 6.3 Khởi chạy Frontend React
1. Mở terminal mới, di chuyển đến thư mục frontend và cài đặt thư viện:
   ```bash
   cd frontend
   npm install
   ```
2. Khởi động server phát triển Vite:
   ```bash
   npm run dev
   # Mở trình duyệt truy cập: http://localhost:5173
   ```
3. Khi React gửi yêu cầu tới các API có dạng `/api/*`, Vite sẽ tự động proxy yêu cầu sang backend cổng `5000` mà không bị lỗi CORS.
