from app.extensions import db
from app.models.rule import RuleConfig, AssociationRule
from app.models.ai_provider import AIProvider
from app.models.ai_usage import AIUsageLog
from app.services.ai_key_service import decrypt_key
from datetime import date
import requests
import json
import time

def call_gemini(prompt, content_type, admin_id=None):
    provider = AIProvider.query.filter_by(provider_name='gemini', is_active=True).first()
    api_key = ""
    model_name = "gemini-2.0-flash"
    
    if provider and provider.api_key_encrypted:
        try:
            api_key = decrypt_key(provider.api_key_encrypted)
            if provider.model_name:
                model_name = provider.model_name
        except Exception as e:
            print(f"Lỗi giải mã API Key: {str(e)}")
            
    if not api_key:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt + "\nLưu ý quan trọng: Chỉ trả về nội dung JSON hợp lệ, không được bọc trong block code markdown ```json hay bất kỳ chữ nào bên ngoài."
            }]
        }]
    }
    
    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        response_time = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            res_data = response.json()
            text_out = res_data['candidates'][0]['content']['parts'][0]['text']
            
            text_out = text_out.strip()
            if text_out.startswith("```json"):
                text_out = text_out[7:]
            if text_out.endswith("```"):
                text_out = text_out[:-3]
            text_out = text_out.strip()
            
            parsed_json = json.loads(text_out)
            
            # Log usage
            tokens = len(prompt) // 4 + len(text_out) // 4
            cost = (tokens / 1000000.0) * 0.15
            
            log = AIUsageLog(
                provider_id=provider.id,
                content_type=content_type,
                tokens_used=tokens,
                cost_usd=cost,
                request_payload=f"Gemini prompt length: {len(prompt)}",
                response_time_ms=response_time,
                admin_id=admin_id
            )
            db.session.add(log)
            db.session.commit()
            
            return parsed_json
        else:
            print(f"Gemini API error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Lỗi gọi Gemini: {str(e)}")
        
    return None

def generate_mining_insight_summary(config_id, admin_id=None):
    """
    Summarizes the generated association rules and proposes business strategies.
    """
    config = RuleConfig.query.get(config_id)
    if not config:
        return {"error": "Cấu hình khai phá không tồn tại"}
        
    rules = AssociationRule.query.filter_by(config_id=config_id).order_by(AssociationRule.lift.desc()).limit(15).all()
    if not rules:
        return {
            "summary": "### Kết quả phân tích\n\nKhông có luật kết hợp mạnh nào được tìm thấy với các ngưỡng thiết lập hiện tại. Hãy thử hạ thấp Min Support hoặc Min Confidence để tìm thêm các luật tiềm năng.",
            "strategies": []
        }
        
    rules_text = ""
    for idx, rule in enumerate(rules):
        rules_text += f"{idx+1}. IF {', '.join(rule.antecedent)} THEN {', '.join(rule.consequent)} (Support: {rule.support:.3f}, Confidence: {rule.confidence:.2f}, Lift: {rule.lift:.2f})\n"
        
    prompt = f"""Bạn là một chuyên gia khoa học dữ liệu và phân tích kinh doanh khách sạn.
Dưới đây là danh sách các luật kết hợp mạnh được khai phá từ cơ sở dữ liệu đặt phòng khách sạn (119,390 dòng):
{rules_text}

Hãy thực hiện các yêu cầu sau:
1. Tóm tắt top 5-7 luật thú vị và thực tế nhất bằng ngôn ngữ tự nhiên, dễ hiểu với quản trị viên khách sạn. Giải thích ý nghĩa kinh tế/vận hành của chúng.
2. Đề xuất ít nhất 3 chiến lược kinh doanh cụ thể (chương trình combo, voucher, tối ưu giá, dịch vụ phụ đi kèm) dựa trực tiếp trên các luật này để tăng doanh thu hoặc giảm tỷ lệ hủy phòng.

Trả về kết quả dưới dạng JSON có cấu trúc sau:
{{
  "summary": "Chuỗi văn bản markdown tóm tắt các luật và ý nghĩa của chúng",
  "strategies": [
    {{
      "title": "Tên chiến lược",
      "basis_rule": "Luật làm cơ sở cho chiến lược này",
      "action_plan": "Mô tả chi tiết hành động kinh doanh cần làm",
      "expected_benefit": "Lợi ích mong đợi"
    }}
  ]
}}
"""
    res = call_gemini(prompt, "mining_insight", admin_id)
    if res:
        return res
        
    # Mock fallback
    return {
        "summary": "### Phân tích luật kết hợp (Mock Fallback):\n\n* **Luật 1 (Khách gia đình ở Resort chọn HB + Parking)**: Cho thấy nhu cầu cao về sự tiện lợi trọn gói khi gia đình du lịch tự lái xe. Mối liên hệ chặt chẽ giữa Resort và dịch vụ ăn Half Board + chỗ đỗ xe.\n* **Luật 2 (Khách đặt trước lâu chọn hạng phòng Suite)**: Khách hàng lập kế hoạch sớm có xu hướng chọn phòng cao cấp, sẵn sàng chi trả nhiều hơn cho sự thoải mái.\n* **Luật 3 (Khách công tác một mình chọn City Hotel + BB + Không cọc)**: Đặc trưng của phân khúc khách công nghiệp, ưu tiên tính linh hoạt và tiện nghi cơ bản.",
        "strategies": [
            {
                "title": "Combo Gia Đình Resort Trọn Gói",
                "basis_rule": "IF Hotel_Resort, Group_Family THEN Meal_HB, Parking_Yes",
                "action_plan": "Tạo gói combo bao gồm phòng Family Suite, gói ăn sáng & tối (HB), và miễn phí chỗ đỗ xe có mái che.",
                "expected_benefit": "Tăng tỷ lệ đặt phòng resort của phân khúc gia đình lên 15% trong mùa hè."
            },
            {
                "title": "Ưu đãi đặt sớm cho phòng cao cấp",
                "basis_rule": "IF Lead_Long THEN Room_D, Room_E",
                "action_plan": "Giảm giá 12% cho khách hàng đặt hạng phòng Suite (D/E) trước ngày nhận phòng tối thiểu 30 ngày.",
                "expected_benefit": "Đảm bảo công suất phòng cao cấp từ sớm và cải thiện dòng tiền."
            },
            {
                "title": "Gói City Express linh hoạt",
                "basis_rule": "IF Hotel_City, Group_Solo THEN Meal_BB, Deposit_No",
                "action_plan": "Cung cấp chính sách hoàn hủy miễn phí đến 24h trước khi check-in cho khách đặt phòng City Hotel đơn lẻ kèm ăn sáng.",
                "expected_benefit": "Thu hút phân khúc khách công tác bận rộn bận tâm về thay đổi lịch trình phút chót."
            }
        ]
    }

def suggest_promotions_from_rules(config_id, admin_id=None):
    """
    Generates promotional offers based on mining rules.
    """
    config = RuleConfig.query.get(config_id)
    if not config:
        return []
        
    rules = AssociationRule.query.filter_by(config_id=config_id).order_by(AssociationRule.lift.desc()).limit(10).all()
    if not rules:
        return []
        
    rules_text = ""
    for idx, rule in enumerate(rules):
        rules_text += f"{idx+1}. IF {', '.join(rule.antecedent)} THEN {', '.join(rule.consequent)} (Lift: {rule.lift:.2f})\n"
        
    prompt = f"""Dựa trên các luật kết hợp sau được khai phá từ dữ liệu du lịch thực tế:
{rules_text}

Hãy đề xuất 3-4 chương trình khuyến mãi (Promotion/Voucher) cụ thể có thể tạo trên hệ thống. Mỗi chương trình cần có thông tin chi tiết để quản trị viên có thể bấm tạo ngay lập tức.
Cấu trúc trả về bắt buộc phải là một JSON array:
[
  {{
    "name": "Tên chương trình khuyến mãi (ngắn gọn, hấp dẫn)",
    "description": "Mô tả chi tiết ưu đãi và điều kiện áp dụng",
    "discount_type": "percent hoặc fixed",
    "discount_value": 15.0, // hoặc số tiền cụ thể
    "target_group": "Family hoặc Couple hoặc Solo hoặc Large",
    "target_season": "Summer hoặc Spring hoặc Autumn hoặc Winter",
    "services_affected": ["HB", "Parking"],
    "suggested_voucher_code": "Voucher code đề xuất (VD: HEGIA26)"
  }}
]
"""
    res = call_gemini(prompt, "suggest_promo", admin_id)
    if res and isinstance(res, list):
        return res
        
    # Mock fallback
    return [
        {
            "name": "Mùa Hè Gia Đình Resort",
            "description": "Gói ưu đãi trọn gói dành riêng cho gia đình du lịch mùa hè tại Resort. Giảm 10% tổng giá trị đặt phòng, đã bao gồm gói ăn Half Board (HB) và chỗ đỗ xe miễn phí.",
            "discount_type": "percent",
            "discount_value": 10.0,
            "target_group": "Family",
            "target_season": "Summer",
            "services_affected": ["HB", "Parking"],
            "suggested_voucher_code": "FAMSUMMER"
        },
        {
            "name": "Nghỉ Dưỡng Lãng Mạn Mùa Thu",
            "description": "Ưu đãi 15% cho các cặp đôi đặt phòng suite mùa thu tại Resort với gói ăn trọn gói Full Board (FB).",
            "discount_type": "percent",
            "discount_value": 15.0,
            "target_group": "Couple",
            "target_season": "Autumn",
            "services_affected": ["FB"],
            "suggested_voucher_code": "ROMFALL"
        },
        {
            "name": "City Express Công Tác",
            "description": "Ưu đãi giảm thẳng 20 EUR cho khách đặt phòng đơn tại City Hotel kèm bữa sáng BB, chính sách không cọc linh hoạt.",
            "discount_type": "fixed",
            "discount_value": 20.0,
            "target_group": "Solo",
            "target_season": "Spring",
            "services_affected": ["BB"],
            "suggested_voucher_code": "BIZEXPRESS"
        }
    ]

def answer_business_qa(question, admin_id=None):
    """
    Answers business questions using database context and Gemini.
    """
    from app.services.data_service import get_summary_stats
    from app.models.hotel import Hotel
    from app.models.room import Room
    from app.models.user_booking import UserBooking
    
    total_bookings = UserBooking.query.count()
    revenue = db.session.query(db.func.sum(UserBooking.total_price)).scalar() or 0
    canceled_bookings = UserBooking.query.filter_by(status='canceled').count()
    completed_bookings = UserBooking.query.filter_by(status='completed').count()
    
    hotels = Hotel.query.all()
    hotels_info = []
    for h in hotels:
        rooms_count = Room.query.filter_by(hotel_id=h.id).count()
        hotels_info.append(f"- {h.name} ({h.hotel_type}): {rooms_count} loại phòng, {h.total_rooms} phòng vật lý.")
        
    context = f"""Hệ thống đặt phòng hiện tại đang quản lý:
- Tổng số đơn đặt phòng: {total_bookings} đơn.
- Doanh thu tổng cộng: €{revenue:,.2f}
- Đơn hàng đã hoàn thành: {completed_bookings} đơn, Đơn hàng đã hủy: {canceled_bookings} đơn.
Danh sách khách sạn:
{chr(10).join(hotels_info)}
"""

    prompt = f"""Bạn là trợ lý AI phân tích kinh doanh tích hợp trong phần mềm quản lý TravelMind.
Thông tin thống kê hiện tại của hệ thống:
{context}

Quản trị viên hỏi câu hỏi kinh doanh sau:
"{question}"

Hãy trả lời câu hỏi của quản trị viên một cách chuyên nghiệp, chính xác, ngắn gọn và hữu ích bằng tiếng Việt, có sử dụng định dạng markdown phong phú để hiển thị. Nếu dữ liệu hiện tại không đủ, hãy dùng kiến thức nền tảng về dataset đặt phòng khách sạn (119,390 dòng) để đưa ra dự đoán xu thế và giải thích rõ đây là nhận định chuyên môn.

Trả về kết quả định dạng JSON có cấu trúc sau:
{{
  "answer": "Chuỗi trả lời của bạn (có sử dụng markdown để định dạng đẹp)",
  "metrics_referenced": ["Tên các chỉ số bạn đã tham chiếu hoặc tính toán"],
  "business_advice": "Đưa ra 1 gợi ý kinh doanh nhanh liên quan đến câu hỏi"
}}
"""
    res = call_gemini(prompt, "business_qa", admin_id)
    if res:
        return res
        
    # Mock fallback
    return {
        "answer": f"Dựa trên dữ liệu hệ thống hiện tại (Mock Fallback), chúng ta đang quản lý **{len(hotels)} khách sạn** với tổng số **{total_bookings} lượt đặt phòng**. Doanh thu tích lũy đạt **€{revenue:,.2f}**.\n\nĐối với câu hỏi của bạn: *\"{question}\"*, phân tích xu hướng chung cho thấy các Resort Hotel có giá phòng (ADR) cao hơn khoảng 30% và thời gian đặt trước dài hơn hẳn so với City Hotel. Hạng phòng gia đình (Room_F, Room_G) đóng góp doanh thu đáng kể nhất vào các tháng 7, 8.",
        "metrics_referenced": ["Tổng số phòng", "Số lượt đặt phòng", "Doanh thu tổng cộng"],
        "business_advice": "Nên tập trung chạy chiến dịch marketing đặt phòng sớm trước mùa cao điểm hè 3 tháng để tối ưu hóa công suất và giá phòng."
    }
