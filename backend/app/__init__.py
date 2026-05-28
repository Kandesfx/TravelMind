from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, cors, login_manager

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS to allow session cookies
    cors.init_app(app, supports_credentials=True, resources={
        r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}
    })
    
    login_manager.init_app(app)

    # Register routes blueprints
    from app.routes.auth import auth_bp
    from app.routes.public import public_bp
    from app.routes.admin_data import admin_data_bp
    from app.routes.admin_mining import admin_mining_bp
    from app.routes.admin_business import admin_business_bp
    from app.routes.admin_ai import admin_ai_bp
    from app.routes.admin_settings import admin_settings_bp
    from app.routes.admin_hotels import admin_hotels_bp
    from app.routes.admin_bookings import admin_bookings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(public_bp, url_prefix='/api/public')
    app.register_blueprint(admin_data_bp, url_prefix='/api/admin/data')
    app.register_blueprint(admin_mining_bp, url_prefix='/api/admin/rules')
    app.register_blueprint(admin_business_bp, url_prefix='/api/admin/business')
    app.register_blueprint(admin_ai_bp, url_prefix='/api/admin/ai')
    app.register_blueprint(admin_settings_bp, url_prefix='/api/admin/settings')
    app.register_blueprint(admin_hotels_bp, url_prefix='/api/admin/inventory')
    app.register_blueprint(admin_bookings_bp, url_prefix='/api/admin/bookings')

    # Register user loader
    from app.models.user import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Global error handlers
    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Chưa đăng nhập", "code": 401}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Không có quyền truy cập", "code": 403}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Không tìm thấy tài nguyên", "code": 404}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": f"Lỗi máy chủ nội bộ: {str(e)}", "code": 500}), 500

    # Structured logging middleware for close monitoring
    import time
    import logging
    from flask import request, g

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("TravelMind-API")

    @app.before_request
    def start_timer():
        g.start_time = time.time()

    @app.after_request
    def log_request(response):
        if request.path.startswith('/static'):
            return response

        diff = time.time() - g.start_time
        duration = int(diff * 1000)
        
        status_code = response.status_code
        if 200 <= status_code < 300:
            status_str = f"🟢 {status_code}"
        elif 300 <= status_code < 400:
            status_str = f"🔵 {status_code}"
        elif 400 <= status_code < 500:
            status_str = f"🟡 {status_code}"
        else:
            status_str = f"🔴 {status_code}"

        payload = ""
        if request.is_json and request.get_json(silent=True):
            payload = f" | Payload: {request.get_json(silent=True)}"
            if len(payload) > 150:
                payload = payload[:147] + "..."

        query_params = f" | Params: {dict(request.args)}" if request.args else ""

        user_str = "Anonymous"
        try:
            from flask_login import current_user
            if current_user and current_user.is_authenticated:
                user_str = f"User({current_user.username}:{current_user.role})"
        except Exception:
            pass

        logger.info(
            f"{status_str} | {request.method} {request.path}{query_params}{payload} | {duration}ms | User: {user_str} | IP: {request.remote_addr}"
        )
        return response

    # Ensure tables are created
    with app.app_context():
        db.create_all()

    return app
