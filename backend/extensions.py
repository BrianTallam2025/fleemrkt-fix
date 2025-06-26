# backend/extensions.py
# This file initializes Flask extensions globally without tying them to a specific app instance.
# This allows them to be used with the application factory pattern.

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# Initialize SQLAlchemy for database operations.
db = SQLAlchemy()

# Initialize Bcrypt for password hashing.
bcrypt = Bcrypt()

# Flask-Migrate and Flask-JWT-Extended instances are initialized and bound to the app
# within the create_app() function in app.py. They don't need global initialization here.
