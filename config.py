import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, 'database.db')

class Config:
    # Secret key for sessions and CSRF protection
    SECRET_KEY = 'your-secret-key'
    
    # SQLAlchemy database URI
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_FILE}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # For your sqlite3-based custom functions
    DATABASE = DATABASE_FILE
