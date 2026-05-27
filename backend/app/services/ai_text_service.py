import json
import time
import requests
from flask import current_app
from app.extensions import db
from app.models.ai_provider import AIProvider
from app.models.ai_usage import AIUsageLog
from app.services.ai_key_service import decrypt_key

def generate_mock_text(content_type, variables):
    """Generates mock text as a fallback when Gemini is offline or not configured."""
    combo_name = variables.get('combo_name', 'Gói du lịch đặc biệt')
    services = variables.get('services', [])
    target_group = variables.get('target_group', 'Du khách')
    target_season = variables.get('target_season', 'quanh năm')
    price_estimate = variables.get('price_estimate', '100')
    discount_percent = variables.get('discount_percent', '10')
    
    if content_type == 'combo_desc':
        return {
            "v1": {
                "title": f"Trải Nghiệm {combo_name} Đầy Cảm Hứng",
                "short_desc": f"Gói nghỉ dưỡng {combo_name} được thiết kế đặc biệt cho {target_group} du lịch vào mùa {target_season}.",
                "full_desc": f"Chào mừng bạn đến với gói {combo_name}! Thỏa sức tận hưởng các dịch vụ cao cấp bao gồm {', '.join(services)}. "
                            f"Chúng tôi tự hào mang đến mức giá ưu đãi cực hấp dẫn chỉ từ {price_estimate} USD/đêm, "
                            f"tiết kiệm ngay {discount_percent}% so với giá gốc. Đây là cơ hội vàng để thư giãn cùng những người thân yêu.",
                "highlights": [f"Thích hợp cho {target_group}", f"Nghỉ dưỡng mùa {target_season}", "Dịch vụ chất lượng cao", f"Giảm giá {discount_percent}%"]
            },
            "v2": {
                "title": f"Khám Phá Thiên Đường {combo_name}",
                "short_desc": f"Nâng tầm chuyến đi mùa {target_season} của bạn cùng combo {combo_name} đẳng cấp.",
                "full_desc": f"Kế hoạch du lịch của bạn đã sẵn sàng với {combo_name}. Trải nghiệm tuyệt vời với các tùy chọn dịch vụ: {', '.join(services)}. "
                            f"Chỉ với khoảng {price_estimate} USD/đêm, bạn sẽ được tận hưởng dịch vụ hàng đầu và tiết kiệm tới {discount_percent}%. "
                            f"Thích hợp nhất cho khách {target_group} tìm kiếm sự thoải mái và tiện nghi.",
                "highlights": ["Dịch vụ trọn gói tiện lợi", "Tiết kiệm chi phí tối đa", f"Ưu tiên cho {target_group}", "Đặt trước linh hoạt"]
            },
            "v3": {
                "title": f"Hành Trình Vàng: {combo_name}",
                "short_desc": f"Khám phá sự kết hợp hoàn hảo giữa nghỉ dưỡng và ẩm thực trong combo {combo_name}.",
                "full_desc": f"Hãy biến kỳ nghỉ mùa {target_season} của bạn thành kỷ niệm đáng nhớ với combo {combo_name}. "
                            f"Bao gồm đầy đủ các dịch vụ {', '.join(services)}, hỗ trợ đắc lực cho chuyến đi của {target_group}. "
                            f"Mức giá ước tính {price_estimate} USD/đêm đã bao gồm chiết khấu {discount_percent}% cực ưu đãi.",
                "highlights": [f"Dành riêng cho {target_group}", f"Du lịch mùa {target_season}", "Ẩm thực phong phú", "Không phí phát sinh"]
            }
        }
    elif content_type == 'event_desc':
        event_name = variables.get('event_name', 'Sự kiện đặc biệt')
        start_date = variables.get('start_date', 'Hôm nay')
        end_date = variables.get('end_date', 'Sắp tới')
        target_audience = variables.get('target_audience', 'Mọi khách hàng')
        return {
            "v1": {
                "title": f"Bùng Nổ Lễ Hội: {event_name}",
                "short_desc": f"Đón chào sự kiện du lịch {event_name} hoành tráng diễn ra từ {start_date} đến {end_date}.",
                "full_desc": f"Hãy chuẩn bị cho một sự kiện hoành tráng nhất trong năm - {event_name}! Thiết lập đặc biệt dành cho đối tượng {target_audience}. "
                            f"Nhận ngay voucher giảm giá độc quyền và khám phá hàng loạt gói combo khuyến mãi đặc biệt kéo dài suốt thời gian sự kiện. "
                            f"Hãy đặt phòng ngay hôm nay để nhận ưu đãi tốt nhất!"
            },
            "v2": {
                "title": f"Siêu Khuyến Mãi Mùa Vụ {event_name}",
                "short_desc": f"Cơ hội du lịch giá tốt nhất năm tại chiến dịch {event_name}.",
                "full_desc": f"Chiến dịch {event_name} chính thức khởi động từ {start_date} đến {end_date}. "
                            f"Được thiết kế để mang lại trải nghiệm tối ưu cho {target_audience}. "
                            f"Hàng ngàn mã giảm giá và gói dịch vụ tiện ích đang chờ đón bạn."
            },
            "v3": {
                "title": f"Hành Trình Mới Cùng {event_name}",
                "short_desc": f"Đăng ký tham gia ngay {event_name} để hưởng trọn các đặc quyền thành viên.",
                "full_desc": f"Đừng bỏ lỡ chương trình {event_name} dành riêng cho {target_audience}. "
                            f"Từ ngày {start_date} đến ngày {end_date}, chúng tôi hỗ trợ nâng cấp phòng miễn phí "
                            f"và giảm giá trực tiếp trên các combo liên kết."
            }
        }
    return {"v1": {"title": "Nội dung mẫu", "short_desc": "Mô tả mẫu", "full_desc": "Mô tả đầy đủ mẫu"}}

def generate_text_content(content_type: str, variables: dict, template_prompt: str, tone: str = "friendly", admin_id: int = None) -> dict:
    """
    Sends request to Gemini API (REST) using AES decrypted keys.
    Falls back to mock responses if API fails or is not configured.
    """
    # 1. Fetch active Gemini provider
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
            
    # Formulate prompt using template variables
    prompt = template_prompt
    for k, v in variables.items():
        val = v if not isinstance(v, list) else ", ".join(map(str, v))
        prompt = prompt.replace(f"{{{k}}}", str(val))
        
    prompt += f"\nGiọng điệu văn phong: {tone}."
    
    # 2. Call API if configured
    if api_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        # We ask Gemini to output JSON
        # Adding a system instruction to output JSON is also recommended
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt + "\nLưu ý quan trọng: Chỉ trả về nội dung JSON hợp lệ bao gồm 3 phiên bản v1, v2, v3, không được bọc trong block code markdown ```json."
                }]
            }]
        }
        
        start_time = time.time()
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            response_time = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                res_data = response.json()
                text_out = res_data['candidates'][0]['content']['parts'][0]['text']
                
                # Sanitize block code markdown if LLM returned it
                text_out = text_out.strip()
                if text_out.startswith("```json"):
                    text_out = text_out[7:]
                if text_out.endswith("```"):
                    text_out = text_out[:-3]
                text_out = text_out.strip()
                
                parsed_json = json.loads(text_out)
                
                # Log usage
                tokens = len(prompt) // 4 + len(text_out) // 4 # Simple token estimation
                cost = (tokens / 1000000.0) * 0.15 # Gemini Flash cost is extremely low
                
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
                print(f"Gemini API returned error code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Lỗi khi gọi API Gemini: {str(e)}")
            
    # 3. Fallback mock if API call is skipped or fails
    print("Sử dụng Mock Generator Fallback cho nội dung văn bản.")
    # Log mock usage with 0 cost
    if provider:
        log = AIUsageLog(
            provider_id=provider.id,
            content_type=content_type,
            tokens_used=0,
            cost_usd=0.0,
            request_payload="Mock generator fallback",
            response_time_ms=10,
            admin_id=admin_id
        )
        db.session.add(log)
        db.session.commit()
        
    return generate_mock_text(content_type, variables)
