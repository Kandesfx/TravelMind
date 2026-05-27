from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app.extensions import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    full_name = data.get('full_name')
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    
    if not username or not email or not password:
        return jsonify({"error": "Vui lòng nhập đầy đủ username, email và password", "code": 400}), 400
        
    if password != confirm_password:
        return jsonify({"error": "Mật khẩu xác nhận không khớp", "code": 400}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Tên đăng nhập đã tồn tại", "code": 400}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email đã được đăng ký", "code": 400}), 400
        
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        role='user' # Mặc định đăng ký mới là role user
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Auto login after register
    login_user(user)
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "message": "Đăng ký và đăng nhập thành công"
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    remember_me = data.get('remember_me', False)
    
    if not username or not password:
        return jsonify({"error": "Vui lòng điền tên đăng nhập và mật khẩu", "code": 400}), 400
        
    user = User.query.filter((User.username == username) | (User.email == username)).first()
    
    if not user or not user.check_password(password):
        return jsonify({"error": "Tên đăng nhập hoặc mật khẩu không chính xác", "code": 400}), 400
        
    if not user.is_active:
        return jsonify({"error": "Tài khoản của bạn đã bị khóa", "code": 403}), 403
        
    login_user(user, remember=remember_me)
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "message": "Đăng nhập thành công"
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Đã đăng xuất thành công"}), 200

@auth_bp.route('/me', methods=['GET'])
def me():
    if not current_user.is_authenticated:
        return jsonify({"logged_in": False}), 200
        
    return jsonify({
        "logged_in": True,
        "user": current_user.to_dict()
    }), 200
