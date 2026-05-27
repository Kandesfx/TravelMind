from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.rule import RuleConfig, AssociationRule
from app.services.mining_service import run_association_rules_mining
from app.services.ai_insight_service import (
    generate_mining_insight_summary,
    suggest_promotions_from_rules,
    answer_business_qa
)

admin_mining_bp = Blueprint('admin_mining', __name__)

def check_admin():
    if not current_user.is_authenticated or current_user.role != 'admin':
        return False
    return True

@admin_mining_bp.before_request
@login_required
def before_request():
    if not check_admin():
        return jsonify({"error": "Không có quyền truy cập", "code": 403}), 403

@admin_mining_bp.route('/run', methods=['POST'])
def run_mining():
    data = request.get_json() or {}
    algorithm = data.get('algorithm', 'fpgrowth')
    min_support = float(data.get('min_support', 0.05))
    min_confidence = float(data.get('min_confidence', 0.50))
    min_lift = float(data.get('min_lift', 1.20))
    features = data.get('features') # list of features
    only_successful = data.get('only_successful', True)
    
    config, msg = run_association_rules_mining(
        algorithm=algorithm,
        min_support=min_support,
        min_confidence=min_confidence,
        min_lift=min_lift,
        features_list=features,
        only_successful=only_successful,
        user_id=current_user.id
    )
    
    if not config:
        return jsonify({"error": msg, "code": 400}), 400
        
    # Get top 10 rules generated in this config run
    top_rules = AssociationRule.query.filter_by(config_id=config.id).order_by(AssociationRule.lift.desc()).limit(10).all()
    
    return jsonify({
        "config_id": config.id,
        "algorithm": config.algorithm,
        "total_transactions": config.total_transactions,
        "total_rules": config.total_rules_generated,
        "execution_time_seconds": config.execution_time_seconds,
        "top_rules": [r.to_dict() for r in top_rules],
        "message": msg
    }), 200

@admin_mining_bp.route('', methods=['GET'])
def get_rules():
    config_id = request.args.get('config_id', type=int)
    min_confidence = request.args.get('min_confidence', type=float)
    sort_by = request.args.get('sort', 'lift') # lift / confidence / support
    limit = request.args.get('limit', 20, type=int)
    
    # If no config_id specified, get the latest rule config run
    if not config_id:
        latest_config = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()
        if not latest_config:
            return jsonify({"rules": [], "configs": [], "message": "Chưa chạy thuật toán khai phá luật nào."}), 200
        config_id = latest_config.id
        
    query = AssociationRule.query.filter_by(config_id=config_id)
    
    if min_confidence:
        query = query.filter(AssociationRule.confidence >= min_confidence)
        
    if sort_by == 'confidence':
        query = query.order_by(AssociationRule.confidence.desc())
    elif sort_by == 'support':
        query = query.order_by(AssociationRule.support.desc())
    else:
        query = query.order_by(AssociationRule.lift.desc())
        
    rules = query.limit(limit).all()
    all_configs = RuleConfig.query.order_by(RuleConfig.created_at.desc()).all()
    
    return jsonify({
        "rules": [r.to_dict() for r in rules],
        "configs": [c.to_dict() for c in all_configs],
        "selected_config_id": config_id
    }), 200

@admin_mining_bp.route('/segments', methods=['GET'])
def get_customer_segments():
    # Return structured stats on the 5 traveler personas (based on typical 119k dataset analysis)
    segments = [
        {
            "name": "Planner (Khách lên lịch trước)",
            "type": "planner",
            "percentage": 23,
            "count": 27459,
            "characteristics": {
                "lead_time_avg": 142, # Long lead time
                "hotel_preference": "Resort Hotel",
                "meal_preference": "HB (Half Board)",
                "season_preference": "Summer",
                "avg_adr": 115.5
            }
        },
        {
            "name": "Last-Minute (Khách đặt phút chót)",
            "type": "last_minute",
            "percentage": 18,
            "count": 21490,
            "characteristics": {
                "lead_time_avg": 4, # Very short lead time
                "hotel_preference": "City Hotel",
                "meal_preference": "BB (Bed & Breakfast)",
                "season_preference": "Summer",
                "avg_adr": 105.2
            }
        },
        {
            "name": "Business (Khách công tác)",
            "type": "business",
            "percentage": 15,
            "count": 17908,
            "characteristics": {
                "lead_time_avg": 12,
                "hotel_preference": "City Hotel",
                "meal_preference": "BB (Bed & Breakfast)",
                "season_preference": "Spring / Autumn",
                "avg_adr": 98.4
            }
        },
        {
            "name": "Romantic Couple (Cặp đôi nghỉ dưỡng)",
            "type": "romantic",
            "percentage": 12,
            "count": 14326,
            "characteristics": {
                "lead_time_avg": 65,
                "hotel_preference": "Resort Hotel",
                "meal_preference": "FB (Full Board)",
                "season_preference": "Autumn / Spring",
                "avg_adr": 160.0
            }
        },
        {
            "name": "Family (Gia đình du lịch)",
            "type": "family",
            "percentage": 32,
            "count": 38204,
            "characteristics": {
                "lead_time_avg": 82,
                "hotel_preference": "Resort Hotel",
                "meal_preference": "HB (Half Board)",
                "season_preference": "Summer",
                "avg_adr": 135.2
            }
        }
    ]
    return jsonify({"segments": segments}), 200

@admin_mining_bp.route('/insights', methods=['GET'])
def get_ai_insights():
    config_id = request.args.get('config_id', type=int)
    if not config_id:
        latest = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()
        if not latest:
            return jsonify({"error": "Chưa có cấu hình khai phá nào"}), 400
        config_id = latest.id
        
    insights = generate_mining_insight_summary(config_id, admin_id=current_user.id)
    return jsonify(insights), 200

@admin_mining_bp.route('/promotions', methods=['GET'])
def get_ai_promotions():
    config_id = request.args.get('config_id', type=int)
    if not config_id:
        latest = RuleConfig.query.order_by(RuleConfig.created_at.desc()).first()
        if not latest:
            return jsonify({"error": "Chưa có cấu hình khai phá nào"}), 400
        config_id = latest.id
        
    promotions = suggest_promotions_from_rules(config_id, admin_id=current_user.id)
    return jsonify({"promotions": promotions}), 200

@admin_mining_bp.route('/qa', methods=['POST'])
def post_business_qa():
    data = request.get_json() or {}
    question = data.get('question')
    if not question:
        return jsonify({"error": "Vui lòng cung cấp câu hỏi", "code": 400}), 400
        
    ans = answer_business_qa(question, admin_id=current_user.id)
    return jsonify(ans), 200
