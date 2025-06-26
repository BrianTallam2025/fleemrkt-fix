# backend/models.py
# This file defines the database models for the Flea Market application.

from datetime import datetime, timezone
from backend.extensions import db, bcrypt # Import db and bcrypt from extensions.py

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='user') # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    items = db.relationship('Item', backref='owner', lazy=True)
    sent_requests = db.relationship('Request', foreign_keys='Request.requester_id', backref='requester', lazy=True)
    received_requests = db.relationship('Request', foreign_keys='Request.owner_id', backref='item_owner', lazy=True)
    ratings_given = db.relationship('Rating', foreign_keys='Rating.rater_id', backref='rater', lazy=True)
    ratings_received = db.relationship('Rating', foreign_keys='Rating.rated_user_id', backref='rated_user', lazy=True)

    def __init__(self, username, email, password, role='user'):
        self.username = username
        self.email = email
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        self.role = role

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Item(db.Model):
    __tablename__ = 'items'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(255), nullable=True) # Optional image URL
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(20), default='available') # e.g., 'available', 'pending', 'exchanged'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    requests = db.relationship('Request', backref='item', lazy=True)

    def __repr__(self):
        return f'<Item {self.title}>'

class Request(db.Model):
    __tablename__ = 'requests'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='pending') # e.g., 'pending', 'accepted', 'rejected', 'cancelled'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # The owner of the item

    def __repr__(self):
        return f'<Request {self.id} for Item {self.item_id} by User {self.requester_id}>'

class Rating(db.Model):
    __tablename__ = 'ratings'
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, nullable=False) # e.g., 1-5 stars
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    rater_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # User giving the rating
    rated_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # User being rated

    def __repr__(self):
        return f'<Rating {self.score} by {self.rater_id} for {self.rated_user_id}>'

class TokenBlacklist(db.Model):
    __tablename__ = 'token_blacklist'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True) # JWT ID
    expires = db.Column(db.DateTime, nullable=False) # When the token expires

    def __repr__(self):
        return f'<Token {self.jti} revoked until {self.expires}>'
