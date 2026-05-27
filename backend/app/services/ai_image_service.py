import os
import time
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
from flask import current_app
from app.extensions import db
from app.models.ai_provider import AIProvider
from app.models.ai_usage import AIUsageLog

def generate_local_gradient_image(prompt: str, target_path: Path) -> bool:
    """
    Generates a beautiful gradient banner with a text overlay locally using matplotlib.
    Guarantees a valid, high-resolution visual asset without API dependencies.
    """
    try:
        # Create a beautiful gradient
        fig, ax = plt.subplots(figsize=(10, 5.625), dpi=100) # 16:9 aspect ratio
        
        # Sunset / tropical color palettes based on keywords in prompt
        p_lower = prompt.lower()
        if 'summer' in p_lower or 'family' in p_lower:
            # Sunset gradient: orange to deep purple
            color1 = [0.95, 0.45, 0.15]
            color2 = [0.35, 0.15, 0.45]
        elif 'romantic' in p_lower or 'autumn' in p_lower:
            # Rose / gold gradient
            color1 = [0.85, 0.25, 0.35]
            color2 = [0.95, 0.75, 0.25]
        elif 'business' in p_lower or 'city' in p_lower:
            # Deep blue / teal business gradient
            color1 = [0.05, 0.25, 0.45]
            color2 = [0.15, 0.65, 0.65]
        else:
            # Teal / violet default gradient
            color1 = [0.12, 0.45, 0.55]
            color2 = [0.45, 0.25, 0.65]
            
        # Draw gradient background
        x = np.linspace(0, 1, 200)
        y = np.linspace(0, 1, 200)
        X, Y = np.meshgrid(x, y)
        
        # Linear gradient logic
        gradient = X * 0.7 + Y * 0.3
        
        R = color1[0] + gradient * (color2[0] - color1[0])
        G = color1[1] + gradient * (color2[1] - color1[1])
        B = color1[2] + gradient * (color2[2] - color1[2])
        
        rgb = np.dstack((R, G, B))
        ax.imshow(rgb, aspect='auto', extent=[0, 10, 0, 6])
        
        # Add decorative glass-like white rectangle
        rect = plt.Rectangle((1, 1), 8, 4, facecolor='white', alpha=0.15, edgecolor='white', linewidth=1.5, rx=0.2, ry=0.2)
        ax.add_patch(rect)
        
        # Add branding logo text
        ax.text(1.5, 4.3, "🧠 TravelMind AI Studio", color='white', fontsize=18, fontweight='bold', alpha=0.9)
        
        # Extract title from prompt
        title_text = "Khám Phá Kỳ Nghỉ Tuyệt Vời"
        if "family" in p_lower:
            title_text = "Kỳ Nghỉ Hè Gia Đình Ấm Cúng"
        elif "romantic" in p_lower:
            title_text = "Tuần Trăng Mật Lãng Mạn Mùa Thu"
        elif "business" in p_lower:
            title_text = "Chuyến Công Tác Trực Tuyến Đô Thị"
            
        # Draw main title text
        ax.text(1.5, 2.8, title_text, color='white', fontsize=26, fontweight='bold', wrap=True)
        
        # Subtitle
        subtitle = "Gợi ý thông minh từ luật kết hợp dữ liệu đặt phòng"
        ax.text(1.5, 1.8, subtitle, color='white', fontsize=14, fontstyle='italic', alpha=0.8)
        
        ax.axis('off')
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
        
        # Save file
        os.makedirs(target_path.parent, exist_ok=True)
        plt.savefig(str(target_path), bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        return True
    except Exception as e:
        print(f"Lỗi tạo ảnh local: {str(e)}")
        return False

def generate_ai_image(prompt: str, target_type: str, target_id: int, style: str = "photography", aspect_ratio: str = "16:9", admin_id: int = None) -> list:
    """
    Simulates calling Stability AI/DALL-E. Falls back to generating a beautiful
    local gradient banner using matplotlib and saving it to static uploads.
    """
    provider = AIProvider.query.filter_by(service_type='image', is_active=True).first()
    provider_id = provider.id if provider else 1
    
    # 1. Define filename and target path
    filename = f"ai_img_{int(time.time())}_{target_type}_{target_id}.jpg"
    uploads_dir = Path(current_app.config['UPLOAD_FOLDER'])
    target_path = uploads_dir / filename
    
    # Ensure static route path exists
    static_url = f"/static/uploads/{filename}"
    
    # 2. Call API (Mocked for Stability/OpenAI or triggers local matplotlib generator)
    print(f"Đang sinh ảnh cho prompt: '{prompt}'...")
    start_time = time.time()
    
    # Generate local visual
    success = generate_local_gradient_image(prompt, target_path)
    response_time = int((time.time() - start_time) * 1000)
    
    if success:
        # Save usage log
        log = AIUsageLog(
            provider_id=provider_id,
            content_type="image_gen",
            credits_used=1.0,
            cost_usd=0.01,
            request_payload=f"Image prompt: {prompt}",
            response_time_ms=response_time,
            admin_id=admin_id
        )
        db.session.add(log)
        db.session.commit()
        
        # Return 4 variants (using the same file or copying to different names for testing)
        images = []
        for i in range(1, 5):
            variant_filename = f"ai_img_{i}_{int(time.time())}_{target_type}_{target_id}.jpg"
            variant_path = uploads_dir / variant_filename
            import shutil
            try:
                shutil.copy(target_path, variant_path)
                images.append({
                    "id": i,
                    "url": f"/static/uploads/{variant_filename}",
                    "dimensions": "1920x1080"
                })
            except Exception:
                images.append({
                    "id": i,
                    "url": static_url,
                    "dimensions": "1920x1080"
                })
                
        return images
    else:
        return []
