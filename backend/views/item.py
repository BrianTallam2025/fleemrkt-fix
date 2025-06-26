# backend/views/item.py
# Blueprint for item-related routes (create, get all, get by ID, update, delete).

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import Item, User
from datetime import datetime, timezone

item_bp = Blueprint('item_bp', __name__)

@item_bp.route('/items', methods=['POST'])
@jwt_required()
def create_item():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    location = data.get('location')
    image_url = data.get('image_url')

    if not all([title, description, category, location]):
        return jsonify(msg="Missing required item fields"), 400

    new_item = Item(
        title=title,
        description=description,
        category=category,
        location=location,
        image_url=image_url,
        user_id=current_user_id
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(msg="Item created successfully", item_id=new_item.id), 201

@item_bp.route('/items', methods=['GET'])
def get_all_items():
    items = Item.query.all()
    output = []
    for item in items:
        output.append({
            'id': item.id,
            'title': item.title,
            'description': item.description,
            'category': item.category,
            'location': item.location,
            'image_url': item.image_url,
            'created_at': item.created_at.isoformat(),
            'status': item.status,
            'user_id': item.user_id # Could also fetch username here
        })
    return jsonify(output), 200

@item_bp.route('/items/<int:item_id>', methods=['GET'])
def get_item_by_id(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify(msg="Item not found"), 404
    
    return jsonify({
        'id': item.id,
        'title': item.title,
        'description': item.description,
        'category': item.category,
        'location': item.location,
        'image_url': item.image_url,
        'created_at': item.created_at.isoformat(),
        'status': item.status,
        'user_id': item.user_id
    }), 200

@item_bp.route('/items/<int:item_id>', methods=['PATCH'])
@jwt_required()
def update_item(item_id):
    current_user_id = get_jwt_identity()
    item = Item.query.get(item_id)

    if not item:
        return jsonify(msg="Item not found"), 404
    
    if item.user_id != current_user_id:
        return jsonify(msg="Unauthorized to update this item"), 403
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(item, key):
            setattr(item, key, value)
    
    db.session.commit()
    return jsonify(msg="Item updated successfully"), 200

@item_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    current_user_id = get_jwt_identity()
    item = Item.query.get(item_id)

    if not item:
        return jsonify(msg="Item not found"), 404
    
    if item.user_id != current_user_id:
        return jsonify(msg="Unauthorized to delete this item"), 403
    
    db.session.delete(item)
    db.session.commit()
    return jsonify(msg="Item deleted successfully"), 200
