# backend/views/admin.py
# Blueprint for admin-specific routes (user management, request management).

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db, bcrypt
from backend.models import User, Request, Item, Rating 
from sqlalchemy import or_ 
import functools # IMPORT THIS FOR THE FIX

admin_bp = Blueprint('admin_bp', __name__)

# Helper decorator to ensure user is an admin
def admin_required(fn):
    # CRITICAL FIX: Use functools.wraps to preserve the original function's name
    # This prevents Flask from seeing all decorated functions as having the same 'wrapper' endpoint.
    @functools.wraps(fn) 
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if user and user.role == 'admin':
            return fn(*args, **kwargs)
        else:
            return jsonify(msg="Admin access required"), 403
    return wrapper

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    users = User.query.all()
    output = []
    for user in users:
        output.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'created_at': user.created_at.isoformat()
        })
    return jsonify(output), 200

@admin_bp.route('/create_admin_user', methods=['POST'])
@admin_required
def create_admin_user():
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

    new_admin_user = User(username=username, email=email, password=password, role='admin')
    db.session.add(new_admin_user)
    db.session.commit()
    return jsonify(msg="Admin user created successfully", user_id=new_admin_user.id), 201

@admin_bp.route('/requests', methods=['GET'])
@admin_required
def admin_get_all_requests():
    requests = Request.query.all()
    output = []
    for req in requests:
        item_title = req.item.title if req.item else "Unknown Item"
        requester_username = req.requester.username if req.requester else "Unknown Requester"
        owner_username = req.item_owner.username if req.item_owner else "Unknown Owner"
        output.append({
            'id': req.id,
            'item_id': req.item_id,
            'item_title': item_title,
            'requester_id': req.requester_id,
            'requester_username': requester_username,
            'owner_id': req.owner_id,
            'owner_username': owner_username,
            'status': req.status,
            'created_at': req.created_at.isoformat()
        })
    return jsonify(output), 200

@admin_bp.route('/requests/<int:request_id>', methods=['DELETE'])
@admin_required
def admin_delete_request(request_id):
    req = Request.query.get(request_id)
    if not req:
        return jsonify(msg="Request not found"), 404
    
    db.session.delete(req)
    db.session.commit()
    return jsonify(msg="Request deleted successfully"), 200

# Optional: Admin can delete a user and all their associated data
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify(msg="User not found"), 404
    
    # Delete associated items, requests, and ratings first to avoid integrity errors
    Item.query.filter_by(user_id=user_id).delete()
    Request.query.filter(or_(Request.requester_id == user_id, Request.owner_id == user_id)).delete()
    Rating.query.filter(or_(Rating.rater_id == user_id, Rating.rated_user_id == user_id)).delete()
    
    db.session.delete(user)
    db.session.commit()
    return jsonify(msg="User and associated data deleted successfully"), 200
