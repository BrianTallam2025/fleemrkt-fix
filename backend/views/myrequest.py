# backend/views/myrequest.py
# Blueprint for request-related routes (create, get sent, get received, update status).

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import Request, Item, User
from datetime import datetime, timezone

request_bp = Blueprint('request_bp', __name__)

@request_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_request():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    item_id = data.get('item_id')

    if not item_id:
        return jsonify(msg="Item ID is required"), 400

    item = Item.query.get(item_id)
    if not item:
        return jsonify(msg="Item not found"), 404
    
    if item.user_id == current_user_id:
        return jsonify(msg="Cannot request your own item"), 400

    # Check if a pending request already exists for this item by this user
    existing_request = Request.query.filter_by(
        item_id=item_id,
        requester_id=current_user_id,
        status='pending'
    ).first()

    if existing_request:
        return jsonify(msg="You already have a pending request for this item"), 409

    new_request = Request(
        item_id=item_id,
        requester_id=current_user_id,
        owner_id=item.user_id, # The ID of the item owner
        status='pending'
    )
    db.session.add(new_request)
    db.session.commit()
    return jsonify(msg="Request created successfully", request_id=new_request.id), 201

@request_bp.route('/requests/sent', methods=['GET'])
@jwt_required()
def get_sent_requests():
    current_user_id = get_jwt_identity()
    sent_requests = Request.query.filter_by(requester_id=current_user_id).all()
    output = []
    for req in sent_requests:
        item_title = req.item.title if req.item else "Unknown Item"
        output.append({
            'id': req.id,
            'item_id': req.item_id,
            'item_title': item_title,
            'owner_id': req.owner_id,
            'status': req.status,
            'created_at': req.created_at.isoformat()
        })
    return jsonify(output), 200

@request_bp.route('/requests/received', methods=['GET'])
@jwt_required()
def get_received_requests():
    current_user_id = get_jwt_identity()
    received_requests = Request.query.filter_by(owner_id=current_user_id).all()
    output = []
    for req in received_requests:
        item_title = req.item.title if req.item else "Unknown Item"
        requester_username = req.requester.username if req.requester else "Unknown User"
        output.append({
            'id': req.id,
            'item_id': req.item_id,
            'item_title': item_title,
            'requester_id': req.requester_id,
            'requester_username': requester_username,
            'status': req.status,
            'created_at': req.created_at.isoformat()
        })
    return jsonify(output), 200

@request_bp.route('/requests/<int:request_id>/status', methods=['PUT'])
@jwt_required()
def update_request_status(request_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_status = data.get('status')

    req = Request.query.get(request_id)

    if not req:
        return jsonify(msg="Request not found"), 404
    
    # Only the item owner can update the status of a received request
    if req.owner_id != current_user_id:
        return jsonify(msg="Unauthorized to update this request"), 403

    # Only allow specific status transitions if necessary
    if new_status in ['accepted', 'rejected', 'cancelled']:
        req.status = new_status
        db.session.commit()
        return jsonify(msg=f"Request status updated to {new_status}"), 200
    else:
        return jsonify(msg="Invalid status"), 400
