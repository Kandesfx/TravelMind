from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from app.extensions import db
from app.models import AIContent, AITemplate, AIMedia, Combo, Event, Banner, Voucher
from app.services.ai_text_service import generate_text_content
from app.services.ai_image_service import generate_ai_image
from app.services.ai_video_service import generate_slideshow_video

admin_ai_bp = Blueprint('admin_ai', __name__)

def check_admin():
    return current_user.is_authenticated and current_user.role == 'admin'

@admin_ai_bp.before_request
@login_required
def before_request():
    if not check_admin():
        return jsonify({"error": "Không có quyền truy cập", "code": 403}), 403

# ==========================================
# 1. AI TEXT CONTENT STUDIO
# ==========================================
@admin_ai_bp.route('/content/generate', methods=['POST'])
def generate_text():
    data = request.get_json() or {}
    content_type = data.get('content_type', 'combo_desc')
    target_type = data.get('target_type', 'combo') # combo / event / banner / voucher
    target_id = data.get('target_id')
    template_id = data.get('template_id')
    tone = data.get('tone', 'friendly')
    
    # 1. Fetch template
    template = AITemplate.query.get(template_id)
    if not template:
        # Fallback to a default template content
        template_prompt = "Hãy mô tả gói {combo_name} gồm {services}"
        template_id = None
    else:
        template_prompt = template.prompt_template
        
    # 2. Prepare variables based on target
    variables = {}
    combo_id = None
    event_id = None
    
    if target_type == 'combo' and target_id:
        combo = Combo.query.get(target_id)
        if combo:
            combo_id = combo.id
            variables = {
                "combo_name": combo.name,
                "services": combo.services,
                "target_group": combo.target_group,
                "target_season": combo.target_season,
                "price_estimate": combo.price_estimate,
                "discount_percent": combo.discount_percent
            }
    elif target_type == 'event' and target_id:
        event = Event.query.get(target_id)
        if event:
            event_id = event.id
            variables = {
                "event_name": event.name,
                "start_date": event.start_date.isoformat(),
                "end_date": event.end_date.isoformat(),
                "target_audience": event.target_audience
            }
            
    # 3. Call Service
    versions = generate_text_content(
        content_type=content_type,
        variables=variables,
        template_prompt=template_prompt,
        tone=tone,
        admin_id=current_user.id
    )
    
    # 4. Save as Draft AIContent
    ai_content = AIContent(
        content_type=content_type,
        target_type=target_type,
        target_id=target_id,
        combo_id=combo_id,
        event_id=event_id,
        template_id=template_id,
        prompt_used=f"Prompt template: {template_prompt} | Tone: {tone}",
        generated_text=versions,
        status='draft'
    )
    db.session.add(ai_content)
    db.session.commit()
    
    return jsonify({
        "content_id": ai_content.id,
        "status": ai_content.status,
        "versions": [
            {"version": 1, "text": versions.get('v1', versions.get('v1'))},
            {"version": 2, "text": versions.get('v2', versions.get('v2'))},
            {"version": 3, "text": versions.get('v3', versions.get('v3'))}
        ]
    }), 200

@admin_ai_bp.route('/content', methods=['GET'])
def get_contents():
    status = request.args.get('status', 'draft')
    contents = AIContent.query.filter_by(status=status).order_by(AIContent.created_at.desc()).all()
    return jsonify({"contents": [c.to_dict() for c in contents]}), 200

@admin_ai_bp.route('/content/<int:id>/review', methods=['POST'])
def review_text(id):
    content = AIContent.query.get_or_404(id)
    data = request.get_json() or {}
    action = data.get('action') # approve / reject
    selected_version = int(data.get('selected_version', 1))
    edited_text = data.get('edited_text')
    admin_note = data.get('admin_note')
    
    if action == 'approve':
        content.status = 'approved'
        content.selected_version = selected_version
        
        # Determine the final text to publish
        final_text = edited_text
        if not final_text:
            v_key = f"v{selected_version}"
            v_data = content.generated_text.get(v_key, content.generated_text.get('v1'))
            if isinstance(v_data, dict):
                final_text = v_data.get('full_desc', str(v_data))
            else:
                final_text = str(v_data)
                
        content.edited_text = final_text
        content.reviewed_by = current_user.id
        content.reviewed_at = datetime.utcnow()
        content.published_at = datetime.utcnow()
        
        # INTEGRATION: Update the actual target model text!
        if content.target_type == 'combo' and content.combo_id:
            combo = Combo.query.get(content.combo_id)
            if combo:
                # If generated JSON had title, short_desc, full_desc, update them accordingly
                v_key = f"v{selected_version}"
                v_data = content.generated_text.get(v_key, {})
                if isinstance(v_data, dict):
                    combo.name = v_data.get('title', combo.name)
                    combo.short_description = v_data.get('short_desc', combo.short_description)
                    combo.full_description = v_data.get('full_desc', final_text)
                else:
                    combo.full_description = final_text
        elif content.target_type == 'event' and content.event_id:
            event = Event.query.get(content.event_id)
            if event:
                v_key = f"v{selected_version}"
                v_data = content.generated_text.get(v_key, {})
                if isinstance(v_data, dict):
                    event.name = v_data.get('title', event.name)
                    event.description = v_data.get('full_desc', final_text)
                else:
                    event.description = final_text
    else:
        content.status = 'rejected'
        content.reviewed_by = current_user.id
        content.reviewed_at = datetime.utcnow()
        
    content.admin_note = admin_note
    db.session.commit()
    
    return jsonify({
        "content_id": content.id,
        "status": content.status,
        "message": f"Nội dung đã được duyệt với trạng thái {content.status}."
    }), 200

# ==========================================
# 2. AI MEDIA (IMAGE & VIDEO) STUDIOS
# ==========================================
@admin_ai_bp.route('/media/generate-image', methods=['POST'])
def generate_image():
    data = request.get_json() or {}
    prompt = data.get('prompt')
    target_type = data.get('target_type', 'banner') # banner / combo / event
    target_id = data.get('target_id')
    style = data.get('style', 'photography')
    aspect_ratio = data.get('aspect_ratio', '16:9')
    
    if not prompt:
        return jsonify({"error": "Vui lòng nhập prompt sinh ảnh", "code": 400}), 400
        
    images = generate_ai_image(
        prompt=prompt,
        target_type=target_type,
        target_id=target_id,
        style=style,
        aspect_ratio=aspect_ratio,
        admin_id=current_user.id
    )
    
    # Save first image to DB as Draft media
    combo_id = target_id if target_type == 'combo' else None
    event_id = target_id if target_type == 'event' else None
    banner_id = target_id if target_type == 'banner' else None
    
    if images:
        media = AIMedia(
            media_type='image',
            prompt_used=prompt,
            file_url=images[0]["url"],
            dimensions=images[0]["dimensions"],
            target_type=target_type,
            target_id=target_id,
            combo_id=combo_id,
            event_id=event_id,
            banner_id=banner_id,
            status='draft'
        )
        db.session.add(media)
        db.session.commit()
        
    return jsonify({
        "images": images,
        "message": "Sinh ảnh thành công! Hình ảnh đã lưu vào hàng đợi nháp."
    }), 200

@admin_ai_bp.route('/media/generate-video', methods=['POST'])
def generate_video():
    data = request.get_json() or {}
    image_ids = data.get('image_ids', [])
    texts = data.get('texts', [])
    music = data.get('music', 'tropical_vibes')
    duration = int(data.get('duration', 15))
    
    # Fetch image URLs
    image_urls = []
    if image_ids:
        # Convert list to query
        medias = AIMedia.query.filter(AIMedia.id.in_(image_ids)).all()
        image_urls = [m.file_url for m in medias]
        
    # Standard fallback images if none specified
    if not image_urls:
        image_urls = ["/static/uploads/combo_family_summer.jpg"]
        
    video_res = generate_slideshow_video(
        image_urls=image_urls,
        texts=texts,
        music_name=music,
        duration=duration,
        admin_id=current_user.id
    )
    
    # Save video as draft media in DB
    media = AIMedia(
        media_type='video',
        prompt_used=f"Slideshow with texts: {', '.join(texts)}",
        file_url=video_res["url"],
        duration_seconds=video_res["duration"],
        file_size_bytes=int(video_res["size_mb"] * 1024 * 1024),
        target_type='combo',
        status='draft'
    )
    db.session.add(media)
    db.session.commit()
    
    return jsonify({
        "video_id": media.id,
        "url": video_res["url"],
        "duration": video_res["duration"],
        "size_mb": video_res["size_mb"],
        "status": media.status
    }), 200

@admin_ai_bp.route('/media', methods=['GET'])
def get_media_gallery():
    media_type = request.args.get('media_type') # image / video
    query = AIMedia.query
    if media_type:
        query = query.filter_by(media_type=media_type)
        
    gallery = query.order_by(AIMedia.created_at.desc()).all()
    return jsonify({"media": [m.to_dict() for m in gallery]}), 200

@admin_ai_bp.route('/media/<int:id>/status', methods=['POST'])
def update_media_status(id):
    media = AIMedia.query.get_or_404(id)
    data = request.get_json() or {}
    status = data.get('status') # approved / in_use
    
    if status:
        media.status = status
        
        # INTEGRATION: Update the target's image url!
        if status == 'approved' or status == 'in_use':
            if media.target_type == 'combo' and media.combo_id:
                combo = Combo.query.get(media.combo_id)
                if combo: combo.image_url = media.file_url
            elif media.target_type == 'event' and media.event_id:
                event = Event.query.get(media.event_id)
                if event: event.image_url = media.file_url # assuming event can have image
            elif media.target_type == 'banner' and media.banner_id:
                banner = Banner.query.get(media.banner_id)
                if banner: banner.image_url = media.file_url
                
        db.session.commit()
        
    return jsonify(media.to_dict()), 200

# ==========================================
# 3. PROMPT TEMPLATES CRUD
# ==========================================
@admin_ai_bp.route('/templates', methods=['GET'])
def get_templates():
    templates = AITemplate.query.all()
    return jsonify({"templates": [t.to_dict() for t in templates]}), 200

@admin_ai_bp.route('/templates', methods=['POST'])
def create_template():
    data = request.get_json() or {}
    name = data.get('name')
    prompt = data.get('prompt_template')
    if not name or not prompt:
        return jsonify({"error": "Vui lòng nhập tên và nội dung template", "code": 400}), 400
        
    template = AITemplate(
        name=name,
        content_type=data.get('content_type', 'combo_desc'),
        language=data.get('language', 'vi'),
        prompt_template=prompt,
        variables=data.get('variables', []),
        tone=data.get('tone', 'friendly'),
        is_active=data.get('is_active', True)
    )
    db.session.add(template)
    db.session.commit()
    return jsonify(template.to_dict()), 201

@admin_ai_bp.route('/templates/<int:id>', methods=['PUT'])
def update_template(id):
    template = AITemplate.query.get_or_404(id)
    data = request.get_json() or {}
    
    template.name = data.get('name', template.name)
    template.content_type = data.get('content_type', template.content_type)
    template.language = data.get('language', template.language)
    template.prompt_template = data.get('prompt_template', template.prompt_template)
    template.variables = data.get('variables', template.variables)
    template.tone = data.get('tone', template.tone)
    template.is_active = data.get('is_active', template.is_active)
    
    db.session.commit()
    return jsonify(template.to_dict()), 200

@admin_ai_bp.route('/templates/<int:id>', methods=['DELETE'])
def delete_template(id):
    template = AITemplate.query.get_or_404(id)
    db.session.delete(template)
    db.session.commit()
    return jsonify({"message": "Template deleted"}), 200

# ==========================================
# 4. CONTENT REVIEW HISTORY
# ==========================================
@admin_ai_bp.route('/history', methods=['GET'])
def get_moderation_history():
    # Fetch all AIContent that has been reviewed (status is approved or rejected)
    history = AIContent.query.filter(AIContent.status.in_(['approved', 'rejected'])).order_by(AIContent.reviewed_at.desc()).all()
    return jsonify({"history": [c.to_dict() for c in history]}), 200
