# backend/views/auth.py
# Blueprint for authentication-related routes (registration, login).

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.extensions import db, bcrypt
from backend.models import User
from datetime import timedelta

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify(msg="Missing username, email, or password"), 400

    if User.query.filter_by(username=username).first():
        return jsonify(msg="Username already exists"), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify(msg="Email already exists"), 409

    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    # Optionally, automatically log in the user after registration
    # access_token = create_access_token(identity=new_user.id)
    return jsonify(msg="User created successfully", user_id=new_user.id), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify(
            access_token=access_token,
            user_id=user.id,
            username=user.username,
            role=user.role
        ), 200
    else:
        return jsonify(msg="Bad username or password"), 401

# Route to get current user info (example of protected route)
@auth_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify(msg="User not found"), 404
    return jsonify(id=user.id, username=user.username, email=user.email, role=user.role), 200
