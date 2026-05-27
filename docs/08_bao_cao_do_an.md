# BÁO CÁO ĐỒ ÁN MÔN HỌC — KHAI PHÁ DỮ LIỆU

## 🧠 TravelMind — Hệ thống gợi ý combo du lịch thông minh

> **Môn học:** Khai Phá Dữ Liệu  
> **Lĩnh vực ứng dụng:** Du lịch – Khách sạn  
> **Tóm tắt:** Phân tích gần 120.000 lượt đặt phòng khách sạn thật, tìm ra những thói quen đặt phòng phổ biến, từ đó gợi ý các "combo du lịch" hấp dẫn cho khách hàng thông qua một trang web hiện đại.

---

# MỤC LỤC

| Phần | Nội dung | Điểm |
|------|----------|------|
| [Phần 1](#phần-1-thu-thập-và-phân-tích-dữ-liệu) | Thu thập và Phân tích Dữ liệu | 1,5đ |
| [Phần 2](#phần-2-làm-sạch-và-tăng-cường-dữ-liệu) | Làm sạch và Tăng cường Dữ liệu | 1,5đ |
| [Phần 3](#phần-3-thuật-toán-xử-lý-bài-toán) | Thuật toán xử lý bài toán | 2,0đ |
| [Phần 4](#phần-4-xây-dựng-ứng-dụng) | Xây dựng ứng dụng | 3,0đ |
| [Phần 5](#phần-5-trình-bày-báo-cáo-và-thuyết-trình) | Trình bày báo cáo, thuyết trình | 1,0đ |
| [Phần 6](#phần-6-phân-công-và-phối-hợp-nhóm) | Phân công và phối hợp nhóm | 1,0đ |

---

# PHẦN 1: THU THẬP VÀ PHÂN TÍCH DỮ LIỆU
**⭐ Điểm: 1,5đ**

## 1.1. Ý tưởng ban đầu

Khi đặt phòng khách sạn, mỗi khách hàng đều có những lựa chọn riêng: chọn khách sạn nghỉ dưỡng hay khách sạn thành phố, ăn sáng hay ăn cả ba bữa, phòng tiêu chuẩn hay phòng cao cấp, đi một mình hay cả gia đình...

**Câu hỏi đặt ra:** Liệu có quy luật nào ẩn giấu trong hàng trăm ngàn lượt đặt phòng? Ví dụ: *"Những gia đình đi nghỉ dưỡng mùa hè có thường chọn phòng lớn kèm gói ăn bán trọn gói không?"* Nếu tìm ra được các quy luật này, ta có thể tạo ra các **gói combo du lịch** phù hợp nhất cho từng nhóm khách.

## 1.2. Nguồn dữ liệu

Nhóm sử dụng bộ dữ liệu **"Hotel Booking Demand"** (Nhu cầu đặt phòng khách sạn) — một bộ dữ liệu thật được công bố công khai:

| Thông tin | Chi tiết |
|-----------|----------|
| **Nguồn** | Kaggle (trang web chia sẻ dữ liệu lớn nhất thế giới) |
| **Bài báo gốc** | Antonio, de Almeida & Nunes (2019), đăng trên tạp chí Data in Brief |
| **Số lượng dữ liệu** | **119.390 dòng** (mỗi dòng = 1 lượt đặt phòng) |
| **Số cột thông tin** | **32 cột** (mỗi cột = 1 loại thông tin về lượt đặt phòng) |
| **Thời gian** | Từ tháng 7/2015 đến tháng 8/2017 (khoảng 2 năm) |
| **Phạm vi** | 2 khách sạn thật tại Bồ Đào Nha (1 nghỉ dưỡng + 1 thành phố) |
| **Dung lượng** | Khoảng 16,8 MB |

> **Tại sao chọn bộ dữ liệu này?**
> - Đây là dữ liệu **thật 100%**, không phải dữ liệu giả lập hay tạo ngẫu nhiên.
> - Số lượng lớn (~120.000 dòng) — đủ tin cậy để tìm ra quy luật.
> - Chứa đầy đủ thông tin về: loại khách sạn, bữa ăn, loại phòng, nhóm khách, kênh đặt phòng, giá cả... — rất phù hợp để phân tích hành vi khách hàng.

## 1.3. Dữ liệu chứa gì?

Mỗi dòng trong bảng dữ liệu ghi lại thông tin đầy đủ của **một lượt đặt phòng**, gồm 6 nhóm thông tin chính:

### Nhóm 1: Thông tin khách sạn
- **Loại khách sạn:** Resort (nghỉ dưỡng) hay City (thành phố)
- **Trạng thái:** Đặt phòng thành công hay đã hủy

### Nhóm 2: Thông tin thời gian
- **Tháng đến:** Tháng mấy khách nhận phòng (ví dụ: July = tháng 7)
- **Số đêm cuối tuần:** Bao nhiêu đêm thứ 7, chủ nhật
- **Số đêm ngày thường:** Bao nhiêu đêm từ thứ 2 đến thứ 6
- **Đặt trước bao lâu:** Bao nhiêu ngày trước khi đến (ví dụ: 30 ngày = đặt trước 1 tháng)

### Nhóm 3: Thông tin khách hàng
- **Số người lớn, trẻ em, em bé:** Để biết đi 1 mình, đi cặp, hay gia đình
- **Quốc gia:** Khách đến từ nước nào (178 quốc gia khác nhau!)
- **Loại khách:** Khách lẻ, khách nhóm, khách hợp đồng dài hạn, hay khách đoàn
- **Khách quay lại:** Đã từng đặt phòng ở đây chưa

### Nhóm 4: Dịch vụ đi kèm
- **Gói ăn uống:** Chỉ ăn sáng (BB), ăn 2 bữa (HB), ăn 3 bữa (FB), hoặc tự lo (SC)
- **Loại phòng:** Từ phòng tiêu chuẩn A đến phòng sang H (10 loại)
- **Chỗ đỗ xe:** Có cần đỗ xe không
- **Yêu cầu đặc biệt:** Phòng tầng cao, giường phụ, view biển...

### Nhóm 5: Kênh đặt phòng
- **Phân khúc:** Đặt qua mạng, đặt trực tiếp, đặt qua công ty du lịch, hay qua doanh nghiệp

### Nhóm 6: Tài chính
- **Giá phòng trung bình/đêm:** Bao nhiêu tiền mỗi đêm
- **Hình thức đặt cọc:** Không cọc, cọc không hoàn lại, hoặc cọc hoàn lại được

## 1.4. Những phát hiện thú vị khi khảo sát dữ liệu

Sau khi đọc và phân tích toàn bộ 119.390 dòng dữ liệu, nhóm phát hiện **10 điểm quan trọng:**

| # | Phát hiện | Con số cụ thể | Ý nghĩa cho dự án |
|---|-----------|---------------|-------------------|
| 1 | Khách sạn thành phố đông hơn nghỉ dưỡng | City: 66%, Resort: 34% | Cần phân tích riêng từng loại |
| 2 | Tỷ lệ hủy phòng rất cao | 37% đặt phòng bị hủy! | Cần loại bỏ đơn hủy trước khi phân tích |
| 3 | Gói ăn sáng là phổ biến nhất | BB chiếm 77% | Gói ăn là thành phần chính của combo |
| 4 | Phòng loại A (tiêu chuẩn) chiếm đa số | A chiếm 72% | Phân nhóm phòng theo cấp độ |
| 5 | Khách lẻ chiếm 3/4 | Transient: 75% | Tập trung gợi ý cho khách lẻ |
| 6 | Hầu hết không đặt cọc | No Deposit: 88% | Giải thích tỷ lệ hủy cao |
| 7 | Giá phòng dao động lớn | Từ -6$ đến 5.400$/đêm | Có dữ liệu bất thường cần xử lý |
| 8 | Top 5 quốc gia chiếm 73% | PRT, GBR, FRA, ESP, DEU | Chủ yếu khách châu Âu |
| 9 | Mùa hè đông nhất | Tháng 7-8 đỉnh điểm | Có thể tạo combo theo mùa |
| 10 | Một số cột thiếu dữ liệu nặng | `company` thiếu 94% | Cần chiến lược xử lý phù hợp |

> **Kết luận Phần 1:** Bộ dữ liệu thật, lớn, đa dạng, và chứa đủ thông tin cần thiết để tìm ra quy luật hành vi đặt phòng. Các phát hiện ban đầu giúp định hướng rõ ràng cho các bước tiếp theo.

---

# PHẦN 2: LÀM SẠCH VÀ TĂNG CƯỜNG DỮ LIỆU
**⭐ Điểm: 1,5đ**

## 2.1. Tại sao cần "làm sạch" dữ liệu?

Dữ liệu thực tế không bao giờ hoàn hảo. Giống như khi bạn có 120.000 phiếu khảo sát, sẽ luôn có phiếu bị bỏ trống, phiếu ghi sai, hoặc phiếu có câu trả lời vô lý. Nếu đưa thẳng dữ liệu "bẩn" vào phân tích, kết quả sẽ bị sai lệch nghiêm trọng.

**Nhóm phát hiện 4 vấn đề chính cần xử lý:**

## 2.2. Vấn đề 1 — Dữ liệu bị trống (Giá trị thiếu)

Một số cột thông tin bị bỏ trống ở nhiều dòng:

| Cột bị trống | Số dòng trống | Tỷ lệ | Cách xử lý |
|--------------|:-------------:|:------:|------------|
| **Công ty đặt phòng** (`company`) | 112.593 | **94%** | ❌ **Xóa cả cột** — Gần như toàn bộ bị trống, không thể phục hồi |
| **Mã đại lý** (`agent`) | 16.340 | 14% | ✅ Điền `0` — Không có đại lý = khách tự đặt trực tiếp |
| **Quốc gia** (`country`) | 488 | 0,4% | ✅ Điền Bồ Đào Nha (quốc gia phổ biến nhất) |
| **Số trẻ em** (`children`) | 4 | <0,01% | ✅ Điền `0` — Giả định không có trẻ em |

**Giải thích dễ hiểu:** Cột "công ty" bị trống 94% vì hầu hết khách đặt phòng là cá nhân, không thông qua công ty. Việc cố gắng đoán giá trị cho 112.000 dòng trống sẽ tạo ra thông tin giả → quyết định xóa luôn cột này là hợp lý nhất.

## 2.3. Vấn đề 2 — Dữ liệu bất thường (Ngoại lai)

Một số dòng dữ liệu có giá trị rõ ràng là sai hoặc bất thường:

| Vấn đề | Ví dụ cụ thể | Cách xử lý |
|--------|-------------|------------|
| Giá phòng **âm** | -6,38 $/đêm | ❌ Loại bỏ — Giá không thể âm |
| Giá phòng **quá cao** | 5.400 $/đêm | ⚠️ Giới hạn tối đa ở 1.000 $/đêm |
| Đặt phòng **không có ai** | 0 người lớn + 0 trẻ em + 0 em bé | ❌ Loại bỏ — Đặt phòng mà không có khách? |
| Đặt phòng **0 đêm** | 0 đêm cuối tuần + 0 đêm ngày thường | ❌ Loại bỏ — Không ở đêm nào thì không phải booking |

**Giải thích dễ hiểu:** Một phòng khách sạn có giá -6$ (khách sạn phải trả tiền cho khách?) hoặc 5.400$/đêm (đắt hơn khách sạn 5 sao ở Dubai?) rõ ràng là dữ liệu lỗi. Nếu giữ lại, chúng sẽ làm méo mó kết quả phân tích.

## 2.4. Vấn đề 3 — Dữ liệu không nhất quán

| Vấn đề | Giải thích | Cách xử lý |
|--------|-----------|------------|
| Gói ăn "Undefined" | Có 1.169 dòng ghi gói ăn là "Undefined" (không xác định), nhưng thực chất nghĩa giống "SC" (tự phục vụ) | Gộp "Undefined" vào "SC" |
| Hai cột trùng ý nghĩa | `market_segment` và `distribution_channel` đều nói về kênh đặt phòng | Chỉ giữ lại 1 cột |
| Phòng đặt ≠ Phòng thực tế | Khách đặt phòng A nhưng được xếp phòng B (upgrade/downgrade) | Chỉ dùng phòng khách đặt (phản ánh nhu cầu thật) |

## 2.5. Tăng cường dữ liệu — Biến đổi thành "giao dịch mua sắm"

Đây là bước quan trọng nhất: **biến dữ liệu thô thành dạng mà thuật toán có thể hiểu được.**

Ý tưởng cốt lõi: Coi mỗi lượt đặt phòng giống như **một giỏ hàng** trong siêu thị. Thay vì khách mua táo, sữa, bánh mì thì ở đây khách "mua" (chọn) khách sạn Resort, gói ăn sáng, phòng A, đi gia đình, mùa hè...

**Nhóm tạo ra 15 "món hàng" (đặc trưng) từ dữ liệu gốc:**

| # | Đặc trưng | Dữ liệu gốc | Sau khi biến đổi | Ví dụ |
|---|-----------|-------------|-------------------|-------|
| 1 | Loại KS | `hotel` = "Resort Hotel" | `Hotel_Resort` | Hotel_Resort, Hotel_City |
| 2 | Gói ăn | `meal` = "BB" | `Meal_BB` | Meal_BB, Meal_HB, Meal_FB, Meal_SC |
| 3 | Loại phòng | `reserved_room_type` = "A" | `Room_A` | Room_A, Room_D, Room_E... |
| 4 | Loại khách | `customer_type` = "Transient" | `Cust_Transient` | Cust_Transient, Cust_Contract... |
| 5 | Kênh đặt | `market_segment` = "Online TA" | `Ch_OnlineTA` | Ch_OnlineTA, Ch_Direct... |
| 6 | Đặt cọc | `deposit_type` = "No Deposit" | `Dep_NoDeposit` | Dep_NoDeposit, Dep_NonRefund |
| 7 | Nhóm đi | Tính từ `adults`, `children`, `babies` | `Group_Family` | Group_Solo, Group_Couple, Group_Family, Group_Large |
| 8 | Mùa | `arrival_date_month` = "July" | `Season_Summer` | Season_Spring, Summer, Autumn, Winter |
| 9 | Mức giá | `adr` = 85.0 | `Price_Mid` | Price_Budget (<50$), Price_Mid (50-150$), Price_Premium (>150$) |
| 10 | Đặt trước | `lead_time` = 5 | `Lead_LastMinute` | Lead_LastMinute (<7 ngày), Short, Medium, Long |
| 11 | Ở cuối tuần | `stays_in_weekend_nights` = 2 | `Weekend_Short` | Weekend_None, Short (1-2 đêm), Long (3+) |
| 12 | Ở ngày thường | `stays_in_week_nights` = 3 | `Weekday_Medium` | Weekday_Short (≤2), Medium (3-5), Long (6+) |
| 13 | Yêu cầu đặc biệt | `total_of_special_requests` = 1 | `SpecReq_Few` | SpecReq_None, Few (1-2), Many (3+) |
| 14 | Đỗ xe | `required_car_parking_spaces` = 1 | `Parking_Yes` | Parking_Yes, Parking_No |
| 15 | Khách cũ | `is_repeated_guest` = 0 | `Repeat_No` | Repeat_Yes, Repeat_No |

**Ví dụ minh họa — 1 dòng dữ liệu trước và sau khi biến đổi:**

```
📋 DỮ LIỆU GỐC (dòng #1):
   hotel=Resort Hotel, meal=HB, reserved_room_type=D, customer_type=Transient,
   market_segment=Online TA, deposit_type=No Deposit, adults=2, children=1,
   babies=0, arrival_date_month=July, adr=130.5, lead_time=45,
   stays_in_weekend_nights=2, stays_in_week_nights=5,
   total_of_special_requests=2, required_car_parking_spaces=1,
   is_repeated_guest=0

🛒 SAU KHI BIẾN ĐỔI (thành "giỏ hàng"):
   [Hotel_Resort, Meal_HB, Room_D, Cust_Transient, Ch_OnlineTA, Dep_NoDeposit,
    Group_Family, Season_Summer, Price_Mid, Lead_Medium, Weekend_Short,
    Weekday_Medium, SpecReq_Few, Parking_Yes, Repeat_No]
```

## 2.6. Kết quả sau khi làm sạch

| Chỉ số | Trước | Sau | Ghi chú |
|--------|:-----:|:---:|---------|
| Số dòng dữ liệu | 119.390 | ~75.000 | Loại bỏ đơn hủy + dữ liệu lỗi |
| Số cột | 32 | 15 đặc trưng | Chuyển từ dữ liệu thô sang "giỏ hàng" |
| Giá trị trống | 129.000+ | **0** | Đã xử lý tất cả |
| Giá trị bất thường | Có (giá âm, 0 khách) | **0** | Đã loại bỏ |

> **Kết luận Phần 2:** Dữ liệu đã được làm sạch, loại bỏ lỗi, và biến đổi thành dạng "giỏ hàng" với 15 đặc trưng — sẵn sàng để đưa vào thuật toán tìm quy luật.

---

# PHẦN 3: THUẬT TOÁN XỬ LÝ BÀI TOÁN
**⭐ Điểm: 2,0đ**

## 3.1. Bài toán cần giải quyết

**Câu hỏi cốt lõi:** Trong ~75.000 lượt đặt phòng thành công, những lựa chọn nào thường đi cùng nhau?

Đây chính là bài toán **"Phân tích giỏ hàng"** (Market Basket Analysis) — một kỹ thuật nổi tiếng trong lĩnh vực khai phá dữ liệu:
- **Trong siêu thị:** Khách mua tã thường mua luôn bia → Đặt 2 kệ gần nhau.
- **Trong dự án này:** Gia đình đi Resort mùa hè thường chọn gói ăn 2 bữa + phòng D → Tạo combo gia đình.

## 3.2. Thuật toán tìm "quy luật kết hợp"

Nhóm sử dụng 2 thuật toán để tìm ra các quy luật ẩn trong dữ liệu:

### Thuật toán 1: Apriori

**Cách hoạt động (giải thích đơn giản):**

Tưởng tượng bạn có 75.000 giỏ hàng. Apriori hoạt động theo từng bước:

1. **Bước 1 — Đếm từng "món" riêng lẻ:** Đếm xem mỗi lựa chọn xuất hiện trong bao nhiêu giỏ hàng. Ví dụ: "Hotel_City" xuất hiện trong 50.000 giỏ (67%). Nếu tỷ lệ quá thấp (dưới ngưỡng đặt sẵn), loại bỏ.

2. **Bước 2 — Ghép cặp:** Thử ghép 2 món với nhau và đếm lại. Ví dụ: "Hotel_City + Meal_BB" xuất hiện trong 35.000 giỏ (47%). Nếu tỷ lệ quá thấp, loại bỏ.

3. **Bước 3 — Ghép bộ 3, bộ 4...:** Tiếp tục ghép thêm và lọc bớt cho đến khi không ghép được nữa.

4. **Bước 4 — Sinh quy luật:** Từ các bộ phổ biến, tạo ra các quy luật dạng: "Nếu khách chọn A và B, thì thường cũng chọn C".

### Thuật toán 2: FP-Growth

**Cách hoạt động (giải thích đơn giản):**

FP-Growth là phiên bản nhanh hơn của Apriori. Thay vì đếm đi đếm lại nhiều lần, nó:

1. **Đọc dữ liệu 2 lần:** Lần 1 đếm tần suất, lần 2 xây dựng "cây" lưu trữ.
2. **Xây dựng "cây dữ liệu":** Nén 75.000 giỏ hàng thành một cấu trúc cây gọn nhẹ.
3. **Tìm quy luật trực tiếp từ cây:** Không cần tạo hàng triệu tổ hợp thử nghiệm.

**So sánh 2 thuật toán:**

| Tiêu chí | Apriori | FP-Growth |
|----------|---------|-----------|
| **Tốc độ** | Chậm hơn (quét dữ liệu nhiều lần) | Nhanh hơn (chỉ quét 2 lần) |
| **Bộ nhớ** | Ít hơn | Nhiều hơn (do lưu cây) |
| **Dễ hiểu** | Dễ hiểu hơn | Phức tạp hơn |
| **Phù hợp** | Dữ liệu nhỏ-trung bình | Dữ liệu lớn |

> Trong dự án, cả 2 thuật toán đều được triển khai và người dùng có thể chọn sử dụng thuật toán nào trên giao diện quản trị.

## 3.3. Ba chỉ số đánh giá quy luật

Mỗi quy luật tìm được sẽ được đánh giá bằng 3 con số:

### Chỉ số 1: Độ phổ biến (Support)

**Ý nghĩa:** Quy luật này xuất hiện ở bao nhiêu phần trăm tổng số đặt phòng?

> **Ví dụ:** "Gia đình đặt Resort" xuất hiện ở 12% tổng số booking → Support = 0,12
>
> Giống như: "Trong siêu thị, 12% giỏ hàng đều có cả tã lẫn bia."

**Trong dự án:** Ngưỡng tối thiểu mặc định = 0,05 (5%). Nghĩa là chỉ giữ lại những tổ hợp xuất hiện ít nhất 5% trong tổng dữ liệu — đủ phổ biến để tin cậy.

### Chỉ số 2: Độ chắc chắn (Confidence)

**Ý nghĩa:** Khi khách đã chọn A, khả năng họ cũng chọn B là bao nhiêu?

> **Ví dụ:** "65% gia đình đặt Resort cũng chọn gói ăn 2 bữa" → Confidence = 0,65
>
> Giống như: "Trong số khách mua tã, 65% cũng mua bia."

**Trong dự án:** Ngưỡng tối thiểu mặc định = 0,50 (50%). Nghĩa là chỉ giữ lại những quy luật mà "xác suất xảy ra" ≥ 50% — đủ đáng tin cậy.

### Chỉ số 3: Mức bất ngờ (Lift)

**Ý nghĩa:** Quy luật này có thực sự thú vị không, hay chỉ là trùng hợp ngẫu nhiên?

| Lift | Ý nghĩa |
|------|---------|
| **= 1** | Hai lựa chọn không liên quan gì nhau (ngẫu nhiên) |
| **> 1** | Hai lựa chọn CÓ liên quan — xuất hiện cùng nhau nhiều hơn bình thường ✅ |
| **< 1** | Hai lựa chọn "đẩy nhau ra" — ít xuất hiện cùng nhau hơn bình thường ❌ |

> **Ví dụ:** Lift = 2,5 nghĩa là: "Gia đình đi Resort chọn gói HB nhiều gấp 2,5 lần so với ngẫu nhiên" — Đây là một quy luật thú vị!

**Trong dự án:** Ngưỡng tối thiểu = 1,2. Nghĩa là chỉ giữ lại những quy luật mà mức "bất ngờ" ≥ 20% so với ngẫu nhiên.

## 3.4. Ví dụ quy luật tìm được

Sau khi chạy thuật toán với dữ liệu 75.000 booking, hệ thống tìm được các quy luật kiểu:

```
📌 QUY LUẬT 1:
   NẾU khách chọn [Resort + Gia đình + Mùa hè]
   THÌ thường chọn [Gói ăn 2 bữa (HB) + Phòng D]
   → Chắc chắn: 65% | Bất ngờ: 2.5x | Phổ biến: 8%

📌 QUY LUẬT 2:
   NẾU khách chọn [City + Đi 1 mình + Đặt qua mạng]
   THÌ thường chọn [Chỉ ăn sáng (BB) + Phòng A + Không cọc]
   → Chắc chắn: 78% | Bất ngờ: 1.8x | Phổ biến: 15%

📌 QUY LUẬT 3:
   NẾU khách chọn [Resort + Cặp đôi + Mùa thu + Cao cấp]
   THÌ thường chọn [Gói ăn 3 bữa (FB) + Phòng E]
   → Chắc chắn: 52% | Bất ngờ: 3.1x | Phổ biến: 3%
```

## 3.5. Từ quy luật → Gợi ý combo

Khi người dùng chọn tiêu chí trên trang web (ví dụ: Resort + Gia đình + Mùa hè + Ngân sách trung bình), hệ thống sẽ:

1. **Tìm quy luật phù hợp:** So khớp tiêu chí của người dùng với phần "NẾU" của các quy luật.
2. **Tính điểm:** Mỗi quy luật phù hợp được chấm điểm bằng công thức: `Điểm = 40% × Mức khớp + 35% × Độ chắc chắn + 25% × Mức bất ngờ`
3. **Xếp hạng:** Sắp xếp theo điểm từ cao xuống thấp.
4. **Trả về Top 3:** Hiển thị 3 combo tốt nhất cho người dùng.

> **Kết luận Phần 3:** Hệ thống sử dụng 2 thuật toán (Apriori và FP-Growth) để tìm quy luật ẩn trong dữ liệu đặt phòng. Mỗi quy luật được đánh giá bằng 3 chỉ số (Phổ biến, Chắc chắn, Bất ngờ). Các quy luật sau đó được chuyển thành gợi ý combo thông minh cho người dùng.

---

# PHẦN 4: XÂY DỰNG ỨNG DỤNG
**⭐ Điểm: 3,0đ**

## 4.1. Tổng quan kiến trúc

Ứng dụng TravelMind được xây dựng theo mô hình **tách riêng 2 phần:**

```
┌────────────────────────────┐         ┌───────────────────────────┐
│   FRONTEND (Giao diện)     │  ←JSON→ │   BACKEND (Xử lý logic)  │
│   React + Vite             │         │   Python + Flask          │
│   Chạy trên cổng 5173      │         │   Chạy trên cổng 5000    │
│   28 trang giao diện       │         │   REST API trả JSON      │
└────────────────────────────┘         └───────────────────────────┘
                                               ↓
                                       ┌───────────────────┐
                                       │   CƠ SỞ DỮ LIỆU  │
                                       │   SQLite (17 bảng) │
                                       └───────────────────┘
```

**Tại sao tách riêng?**
- **Dễ phát triển:** Một người làm giao diện, người khác làm xử lý logic — không đụng chạm nhau.
- **Dễ bảo trì:** Sửa giao diện không ảnh hưởng đến logic xử lý và ngược lại.
- **Hiện đại:** Đây là cách mà các công ty công nghệ lớn (Google, Facebook) xây dựng ứng dụng web.

## 4.2. Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| **Giao diện** | React 18 + Vite | Trang web tương tác mượt mà, tải nhanh |
| **Thiết kế** | CSS thuần (hiệu ứng kính mờ) | Giao diện đẹp, hiện đại |
| **Biểu đồ** | Chart.js + Plotly.js | Biểu đồ tương tác (click, hover, zoom) |
| **Xử lý logic** | Python + Flask | API xử lý yêu cầu và trả kết quả |
| **Dữ liệu** | pandas + NumPy | Xử lý và phân tích dữ liệu |
| **Thuật toán** | mlxtend (Python) | Chạy Apriori và FP-Growth |
| **Cơ sở dữ liệu** | SQLite + SQLAlchemy | Lưu trữ dữ liệu ứng dụng |
| **AI** | Google Gemini API | Tự động viết mô tả combo bằng AI |

## 4.3. Các trang giao diện (28 trang)

### Trang công khai — Dành cho khách du lịch (8 trang)

| # | Trang | Chức năng chính |
|---|-------|-----------------|
| 1 | 🏠 **Trang chủ** | Giới thiệu TravelMind, combo hot nhất, xu hướng đặt phòng, nút bắt đầu khám phá |
| 2 | 🏨 **Khám phá Khách sạn** | So sánh trực quan Resort vs City: thống kê, biểu đồ radar, combo phổ biến theo từng loại |
| 3 | 🎁 **Gợi ý Combo** ⭐ | Trang cốt lõi — Người dùng chọn 4 tiêu chí → nhận gợi ý Top 3 combo phù hợp nhất |
| 4 | 🧩 **Quiz du khách** | 5 câu hỏi trắc nghiệm xác định kiểu du khách (gia đình, công tác, lãng mạn...) → combo tương ứng |
| 5 | 📋 **Đặt phòng** | Form đặt phòng hoàn chỉnh, gợi ý nâng cấp dịch vụ, áp mã giảm giá |
| 6 | 📊 **Khám phá dữ liệu** | Biểu đồ tương tác: booking theo tháng, quốc gia, giá phòng, loại khách (Plotly) |
| 7 | 🎉 **Chi tiết sự kiện** | Trang sự kiện khuyến mãi với banner, combo đính kèm |
| 8 | 👤 **Hồ sơ cá nhân** | Lịch sử đặt phòng, voucher đã nhận, kết quả quiz |

### Trang quản trị — Dành cho quản lý (18 trang)

| # | Nhóm | Trang | Chức năng |
|---|------|-------|-----------|
| 1 | 📊 Tổng quan | Dashboard KPI | Bảng điều khiển tổng hợp: doanh thu, đặt phòng, tỷ lệ hủy, biểu đồ |
| 2-3 | 📦 Dữ liệu | Quản lý Data, Import | Xem, tìm kiếm dữ liệu booking; import dữ liệu mới |
| 4 | ⚙️ Khai phá | Rules Lab | Chọn thuật toán, điều chỉnh ngưỡng, chạy phân tích, xem biểu đồ mạng lưới |
| 5-9 | 💼 Kinh doanh | Combo, Ưu đãi, Sự kiện, Banner, Voucher | Tạo/sửa/xóa các gói combo, khuyến mãi, sự kiện, banner, mã giảm giá |
| 10-11 | 📈 Báo cáo | Hiệu suất, Khách hàng | Theo dõi tỷ lệ chuyển đổi combo, phân tích hành vi 5 nhóm khách |
| 12-15 | 🤖 AI | Text Studio, Image Studio, Video Studio, Kiểm duyệt | Dùng AI viết mô tả, tạo ảnh, ghép video; quy trình duyệt Nháp → Phê duyệt → Xuất bản |
| 16-18 | ⚙️ Cài đặt | API Keys, AI Usage, Cấu hình | Quản lý khóa API (mã hóa AES-256), theo dõi chi phí AI, cài đặt hệ thống |

## 4.4. Luồng hoạt động chính — Gợi ý Combo

Đây là tính năng cốt lõi của ứng dụng, kết hợp giữa thuật toán khai phá dữ liệu và giao diện web:

```
Người dùng trên trang web          Hệ thống xử lý phía sau
──────────────────────────          ────────────────────────
1. Chọn loại KS: Resort      →    Chuyển thành: Hotel_Resort
2. Chọn nhóm: Gia đình       →    Chuyển thành: Group_Family
3. Chọn mùa: Mùa hè          →    Chuyển thành: Season_Summer
4. Chọn ngân sách: Trung bình →    Chuyển thành: Price_Mid
                                        ↓
                                   So khớp với 500+ quy luật
                                   đã tìm được từ dữ liệu
                                        ↓
                                   Tính điểm cho từng quy luật phù hợp
                                        ↓
                                   Xếp hạng và chọn Top 3
                                        ↓
5. Nhận kết quả: 3 combo     ←    Trả về JSON cho giao diện hiển thị
   - Combo 1: Resort + HB + Room_D (phù hợp 92%)
   - Combo 2: Resort + FB + Room_E (phù hợp 85%)
   - Combo 3: Resort + BB + Room_A (phù hợp 78%)
```

## 4.5. Tích hợp AI

Hệ thống tích hợp AI (Google Gemini) để **tự động viết nội dung cho combo:**

| Chức năng AI | Mô tả | Ví dụ |
|-------------|-------|-------|
| **Viết mô tả** | AI đọc thông tin combo và viết bài giới thiệu hấp dẫn | "Trọn gói nghỉ dưỡng gia đình mùa hè tại resort 5 sao, bao gồm bữa ăn sáng và tối, phòng view biển..." |
| **Tạo banner** | AI tạo hình ảnh quảng cáo phù hợp nội dung | Ảnh banner resort biển xanh với chữ quảng cáo |
| **Kiểm duyệt** | Nội dung AI tạo ra → Quản trị viên duyệt → Mới hiển thị | Quy trình: Nháp → Duyệt → Xuất bản |

**Bảo mật khóa API:** Các khóa API được mã hóa bằng thuật toán AES-256 trước khi lưu vào cơ sở dữ liệu, đảm bảo an toàn ngay cả khi dữ liệu bị lộ.

## 4.6. Cơ sở dữ liệu

Hệ thống sử dụng SQLite với **17 bảng** dữ liệu, được tổ chức thành 4 nhóm:

| Nhóm | Bảng | Mục đích |
|------|------|----------|
| **Dữ liệu gốc** | `bookings`, `data_sources` | Lưu 119.390 bản ghi đặt phòng gốc |
| **Khai phá** | `rule_configs`, `association_rules` | Lưu cấu hình chạy thuật toán và các quy luật tìm được |
| **Kinh doanh** | `combos`, `promotions`, `events`, `banners`, `vouchers` | Lưu thông tin combo, khuyến mãi, sự kiện |
| **Người dùng** | `users`, `user_bookings`, `quiz_results` | Lưu tài khoản, đặt phòng online, kết quả quiz |
| **AI** | `ai_providers`, `ai_contents`, `ai_usage_logs` | Lưu cấu hình AI, nội dung đã tạo, lịch sử sử dụng |

## 4.7. Thiết kế giao diện

Giao diện được thiết kế theo phong cách **hiện đại, cao cấp:**

- **Hiệu ứng kính mờ (Glassmorphism):** Các khung nội dung có nền mờ, tạo cảm giác sang trọng
- **Chế độ tối (Dark mode):** Giao diện tối chủ đạo, dễ nhìn, bắt mắt
- **Hoạt ảnh nhỏ (Micro-animations):** Hiệu ứng hover, chuyển trang mượt mà
- **Biểu đồ tương tác:** Click, hover, zoom vào biểu đồ để xem chi tiết
- **Responsive:** Hiển thị tốt trên cả máy tính và điện thoại

> **Kết luận Phần 4:** Ứng dụng TravelMind là một nền tảng web hoàn chỉnh với 28 trang giao diện, tách biệt Frontend/Backend, tích hợp AI, cơ sở dữ liệu 17 bảng, và giao diện hiện đại. Tính năng cốt lõi là gợi ý combo dựa trên quy luật khai phá từ dữ liệu thật.

---

# PHẦN 5: TRÌNH BÀY BÁO CÁO VÀ THUYẾT TRÌNH
**⭐ Điểm: 1,0đ**

## 5.1. Cấu trúc tài liệu dự án

Dự án có hệ thống tài liệu đầy đủ, được tổ chức trong thư mục `docs/`:

| File | Nội dung | Số trang (ước tính) |
|------|----------|:-------------------:|
| `01_du_lieu.md` | Thu thập & Phân tích dữ liệu | ~15 trang |
| `02_lam_sach_du_lieu.md` | Làm sạch & Tăng cường dữ liệu | ~12 trang |
| `03_thuat_toan.md` | Thuật toán Apriori & FP-Growth | ~18 trang |
| `04_kien_truc_he_thong.md` | Kiến trúc hệ thống (sơ đồ) | ~8 trang |
| `05_database.md` | Thiết kế cơ sở dữ liệu (17 bảng) | ~10 trang |
| `06_dac_ta_chuc_nang.md` | Đặc tả 28 chức năng | ~12 trang |
| `07_api_reference.md` | Tài liệu API (tất cả endpoints) | ~8 trang |
| `README.md` | Tổng quan dự án | ~8 trang |

## 5.2. Gợi ý cấu trúc bài thuyết trình

Dựa trên nội dung dự án, nhóm có thể trình bày theo flow sau:

| Slide | Nội dung | Thời gian | Ghi chú |
|:-----:|----------|:---------:|---------|
| 1 | Tiêu đề + Giới thiệu nhóm | 1 phút | Logo TravelMind, tên thành viên |
| 2-3 | Đặt vấn đề + Ý tưởng giải pháp | 2 phút | "Tại sao cần phân tích dữ liệu đặt phòng?" |
| 4-5 | Bộ dữ liệu: nguồn, quy mô, khảo sát | 2 phút | Con số ấn tượng: 119.390 dòng, 32 cột |
| 6-7 | Làm sạch dữ liệu: vấn đề + cách xử lý | 2 phút | Bảng so sánh trước/sau |
| 8-10 | Thuật toán: giải thích đơn giản + ví dụ | 3 phút | Dùng ví dụ "giỏ hàng siêu thị" |
| 11-13 | Demo ứng dụng (LIVE) | 4 phút | Chạy web, demo gợi ý combo, admin |
| 14 | Kết quả + Hạn chế + Hướng phát triển | 1 phút | Tổng kết |
| 15 | Q&A | — | Sẵn sàng trả lời câu hỏi |

## 5.3. Các câu hỏi thường gặp khi bảo vệ

| Câu hỏi | Gợi ý trả lời |
|---------|----------------|
| "Tại sao chọn Association Rules mà không phải thuật toán khác?" | Vì bài toán là tìm **quy luật đi cùng** giữa các lựa chọn → đúng bản chất của Association Rules. Các thuật toán khác (Classification, Clustering) giải quyết bài toán khác (phân loại, phân nhóm). |
| "Tại sao chọn bộ dữ liệu này?" | Vì đây là dữ liệu thật, đã được công bố trên tạp chí khoa học, có 119.390 dòng (đủ lớn), chứa đủ thông tin về dịch vụ du lịch. |
| "FP-Growth khác Apriori thế nào?" | Cùng mục tiêu (tìm quy luật kết hợp), nhưng FP-Growth nhanh hơn vì chỉ quét dữ liệu 2 lần thay vì nhiều lần như Apriori. Hệ thống hỗ trợ cả 2 để so sánh. |
| "Ngưỡng Support, Confidence chọn thế nào?" | Mặc định: Support ≥ 5%, Confidence ≥ 50%, Lift ≥ 1,2. Quản trị viên có thể điều chỉnh trực tiếp trên giao diện Rules Lab. |
| "AI có vai trò gì trong dự án?" | AI (Gemini) chỉ hỗ trợ **viết mô tả marketing** cho combo, không tham gia vào quá trình khai phá dữ liệu. Toàn bộ quy luật được tìm bởi Apriori/FP-Growth. |

---

# PHẦN 6: PHÂN CÔNG VÀ PHỐI HỢP NHÓM
**⭐ Điểm: 1,0đ**

## 6.1. Phân chia module

Dự án có thể được chia thành 4 mảng công việc chính (tùy theo số thành viên nhóm mà điều chỉnh):

| Mảng | Công việc cụ thể | Kỹ năng cần |
|------|------------------|-------------|
| **📊 Dữ liệu** | Thu thập dữ liệu, phân tích EDA, làm sạch, tạo biến mới, viết script import | Python, pandas |
| **⚙️ Thuật toán** | Triển khai Apriori/FP-Growth, đánh giá kết quả, xây dựng hệ thống gợi ý | Python, mlxtend |
| **🔌 Backend** | Thiết kế API, cơ sở dữ liệu, tích hợp AI, xác thực người dùng | Python, Flask, SQLite |
| **⚛️ Frontend** | Thiết kế giao diện 28 trang, biểu đồ, responsive, hiệu ứng | React, CSS, Chart.js |

## 6.2. Bảng phân công mẫu (nhóm 4 người)

| Thành viên | Vai trò | File/Module phụ trách | Đóng góp |
|------------|---------|----------------------|----------|
| **Thành viên A** | Trưởng nhóm + Dữ liệu | `data_survey.py`, `clean_data.py`, `import_data.py`, `docs/01_*.md`, `docs/02_*.md` | Thu thập, phân tích, làm sạch dữ liệu. Viết tài liệu phần dữ liệu. |
| **Thành viên B** | Thuật toán + Backend | `mining_service.py`, `recommendation_service.py`, `docs/03_*.md` | Triển khai thuật toán, hệ thống gợi ý, viết tài liệu thuật toán. |
| **Thành viên C** | Backend + AI | `routes/`, `models/`, `ai_text_service.py`, `docs/04_*.md`, `docs/05_*.md` | Xây dựng API, CSDL, tích hợp AI, viết tài liệu kiến trúc. |
| **Thành viên D** | Frontend + Thiết kế | `frontend/src/pages/`, `frontend/src/styles/`, `docs/06_*.md` | Thiết kế và lập trình 28 trang giao diện, viết tài liệu chức năng. |

## 6.3. Quy trình phối hợp

```
     Thu thập          Làm sạch          Thuật toán         Ứng dụng
    dữ liệu    →    dữ liệu     →    khai phá       →    web + AI
   ──────────      ──────────        ──────────          ──────────
   Thành viên A    Thành viên A      Thành viên B       Thành viên C+D
                                          ↓
                                   Quy luật kết hợp
                                          ↓
                              ┌────────────┴───────────┐
                              ↓                        ↓
                    Thành viên C              Thành viên D
                    (API gợi ý combo)        (Giao diện hiển thị)
```

## 6.4. Công cụ phối hợp

| Mục đích | Công cụ |
|----------|---------|
| Quản lý mã nguồn | Git + GitHub |
| Trao đổi | Zalo/Discord/Telegram |
| Chia sẻ tài liệu | Google Drive |
| Quản lý công việc | Trello / GitHub Issues |

---

# TÀI LIỆU THAM KHẢO

1. **Antonio, N., de Almeida, A., & Nunes, L.** (2019). Hotel booking demand datasets. *Data in Brief*, 22, 41–49.
2. **Agrawal, R., & Srikant, R.** (1994). Fast Algorithms for Mining Association Rules. *VLDB*, 487–499.
3. **Han, J., Pei, J., & Yin, Y.** (2000). Mining Frequent Patterns without Candidate Generation. *ACM SIGMOD*.
4. **mlxtend** — Thư viện Python cho Machine Learning: [rasbt.github.io/mlxtend](http://rasbt.github.io/mlxtend/)
5. **Google Gemini API**: [ai.google.dev/docs](https://ai.google.dev/docs)
6. **Kaggle — Hotel Booking Demand Dataset**: [kaggle.com/datasets/jessemostipak/hotel-booking-demand](https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand)

---

> **TravelMind** — Biến dữ liệu đặt phòng thành combo du lịch thông minh 🚀
