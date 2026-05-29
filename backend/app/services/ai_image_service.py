import os
import sys
import time
import base64
import requests
import numpy as np
from pathlib import Path

# Ensure standard output and error use UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
from flask import current_app
from app.extensions import db
from app.models.ai_provider import AIProvider
from app.models.ai_usage import AIUsageLog
from app.services.ai_key_service import decrypt_key


# ──────────────────────────────────────────────
# Fallback: generate gradient image locally with matplotlib
# ──────────────────────────────────────────────
def generate_local_gradient_image(prompt: str, target_path: Path) -> bool:
    """
    Generates a beautiful gradient banner with a text overlay locally using matplotlib.
    Used as fallback when Gemini Imagen API is unavailable.
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(10, 5.625), dpi=120)  # 16:9 @ 1200x675

        p_lower = prompt.lower()
        if 'summer' in p_lower or 'family' in p_lower or 'beach' in p_lower:
            color1 = [0.95, 0.45, 0.15]
            color2 = [0.35, 0.15, 0.45]
        elif 'romantic' in p_lower or 'autumn' in p_lower or 'couple' in p_lower:
            color1 = [0.85, 0.25, 0.35]
            color2 = [0.95, 0.75, 0.25]
        elif 'business' in p_lower or 'city' in p_lower or 'corporate' in p_lower:
            color1 = [0.05, 0.25, 0.45]
            color2 = [0.15, 0.65, 0.65]
        elif 'luxury' in p_lower or 'resort' in p_lower:
            color1 = [0.15, 0.10, 0.35]
            color2 = [0.55, 0.40, 0.10]
        else:
            color1 = [0.12, 0.45, 0.55]
            color2 = [0.45, 0.25, 0.65]

        x = np.linspace(0, 1, 300)
        y = np.linspace(0, 1, 300)
        X, Y = np.meshgrid(x, y)
        gradient = X * 0.65 + Y * 0.35

        R = color1[0] + gradient * (color2[0] - color1[0])
        G = color1[1] + gradient * (color2[1] - color1[1])
        B = color1[2] + gradient * (color2[2] - color1[2])

        rgb = np.dstack((R, G, B))
        ax.imshow(rgb, aspect='auto', extent=[0, 10, 0, 6])

        # Overlay semi-transparent dark bottom band
        band = plt.Rectangle((0, 0), 10, 2.2, facecolor='black', alpha=0.45)
        ax.add_patch(band)
        top_band = plt.Rectangle((0, 5.2), 10, 0.8, facecolor='black', alpha=0.3)
        ax.add_patch(top_band)

        # Branding
        ax.text(0.4, 5.55, "✦ TravelMind AI", color='white', fontsize=11,
                fontweight='bold', alpha=0.85)

        # Extract meaningful title from prompt
        title_text = "Kỳ Nghỉ Tuyệt Vời"
        if 'family' in p_lower: title_text = "Kỳ Nghỉ Hè Gia Đình"
        elif 'couple' in p_lower or 'romantic' in p_lower: title_text = "Tuần Trăng Mật Lãng Mạn"
        elif 'business' in p_lower: title_text = "Chuyến Công Tác Đô Thị"
        elif 'luxury' in p_lower or 'resort' in p_lower: title_text = "Resort Đẳng Cấp 5 Sao"
        elif 'beach' in p_lower: title_text = "Thiên Đường Biển Xanh"

        ax.text(5, 1.2, title_text, color='white', fontsize=30, fontweight='bold',
                ha='center', va='center', wrap=True,
                fontfamily='DejaVu Sans')
        ax.text(5, 0.55, "Gợi ý thông minh từ phân tích dữ liệu đặt phòng • TravelMind",
                color='white', alpha=0.7, fontsize=9,
                ha='center', va='center', fontstyle='italic')

        ax.axis('off')
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)

        os.makedirs(target_path.parent, exist_ok=True)
        plt.savefig(str(target_path), bbox_inches='tight', pad_inches=0, dpi=120)
        plt.close(fig)
        print(f"[ai_image] Matplotlib fallback ảnh đã lưu tại: {target_path}")
        return True
    except Exception as e:
        print(f"[ai_image] Lỗi tạo ảnh fallback: {str(e)}")
        return False


# ──────────────────────────────────────────────
# Primary: Call Google Imagen 3 API
# ──────────────────────────────────────────────
def call_imagen3(prompt: str, api_key: str, aspect_ratio: str = "16:9") -> bytes | None:
    """
    Calls Google Imagen 3 (imagen-3.0-generate-002) to generate 1 image.
    Returns raw JPEG/PNG bytes on success, None on failure.
    Aspect ratio mapping: '16:9' -> LANDSCAPE, '1:1' -> SQUARE, '4:3' -> LANDSCAPE.
    """
    # Map UI aspect_ratio to Imagen3 aspectRatio string
    ratio_map = {
        "16:9":  "16:9",
        "1:1":   "1:1",
        "4:3":   "4:3",
        "9:16":  "9:16",
    }
    ar = ratio_map.get(aspect_ratio, "16:9")

    # Build a descriptive, travel-photography-style prompt
    enhanced_prompt = (
        f"{prompt}. "
        "High-quality travel photography, vivid colors, professional lighting, "
        "8K ultra-detailed, cinematic composition, no text, no watermarks."
    )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"imagen-3.0-generate-002:predict?key={api_key}"
    )
    payload = {
        "instances": [{"prompt": enhanced_prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": ar,
            "safetyFilterLevel": "block_only_high",
            "personGeneration": "allow_adult"
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            # Response: {"predictions": [{"bytesBase64Encoded": "...", "mimeType": "image/png"}]}
            predictions = data.get("predictions", [])
            if predictions:
                b64_data = predictions[0].get("bytesBase64Encoded", "")
                if b64_data:
                    return base64.b64decode(b64_data)
            print(f"[ai_image] Imagen3 response OK nhưng không có predictions: {data}")
        else:
            print(f"[ai_image] Imagen3 HTTP {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        print(f"[ai_image] Lỗi gọi Imagen3 API: {str(e)}")

    return None


# ──────────────────────────────────────────────
# Main entry point
# ──────────────────────────────────────────────
def generate_ai_image(prompt: str, target_type: str, target_id: int,
                      style: str = "photography", aspect_ratio: str = "16:9",
                      admin_id: int = None) -> list:
    """
    Generates 1 AI image using Google Imagen 3 when a Gemini API key is configured.
    Falls back to a local matplotlib gradient image if the API is unavailable.

    Returns a list with one image dict: [{"id": 1, "url": "/static/uploads/...", "dimensions": "..."}]
    """
    provider = AIProvider.query.filter_by(provider_name='gemini', is_active=True).first()
    provider_id = provider.id if provider else 1
    api_key = ""

    if provider and provider.api_key_encrypted:
        try:
            api_key = decrypt_key(provider.api_key_encrypted)
        except Exception as e:
            print(f"[ai_image] Lỗi giải mã API Key: {str(e)}")

    # Prepare output path
    timestamp = int(time.time())
    filename = f"ai_img_{timestamp}_{target_type}_{target_id or 0}.jpg"
    uploads_dir = Path(current_app.config['UPLOAD_FOLDER'])
    target_path = uploads_dir / filename
    static_url = f"/static/uploads/{filename}"

    os.makedirs(uploads_dir, exist_ok=True)

    image_bytes = None
    used_api = False
    start_time = time.time()

    # ── Try Imagen 3 API ──
    if api_key:
        print(f"[ai_image] Gọi Imagen 3 cho prompt: '{prompt[:80]}...'")
        image_bytes = call_imagen3(prompt, api_key, aspect_ratio)

        if image_bytes:
            try:
                with open(target_path, 'wb') as f:
                    f.write(image_bytes)
                used_api = True
                print(f"[ai_image] ✅ Imagen 3 sinh ảnh thành công → {filename}")
            except Exception as e:
                print(f"[ai_image] Lỗi lưu ảnh Imagen3: {str(e)}")
                image_bytes = None

    # ── Fallback: matplotlib gradient ──
    if not image_bytes:
        print("[ai_image] Dùng matplotlib fallback.")
        success = generate_local_gradient_image(prompt, target_path)
        if not success:
            print("[ai_image] Cả hai phương thức đều thất bại.")
            return []

    response_time = int((time.time() - start_time) * 1000)

    # Determine dimensions from aspect ratio
    dims_map = {"16:9": "1280x720", "1:1": "1024x1024", "4:3": "1024x768"}
    dimensions = dims_map.get(aspect_ratio, "1280x720")

    # Log usage
    cost = 0.04 if used_api else 0.0
    tokens = 0
    log = AIUsageLog(
        provider_id=provider_id,
        content_type="image_gen",
        credits_used=1.0,
        cost_usd=cost,
        tokens_used=tokens,
        request_payload=f"Imagen3 prompt: {prompt[:120]}" if used_api else "Matplotlib fallback",
        response_time_ms=response_time,
        admin_id=admin_id
    )
    db.session.add(log)
    db.session.commit()

    return [{
        "id": 1,
        "url": static_url,
        "dimensions": dimensions,
        "source": "imagen3" if used_api else "local_gradient"
    }]
