import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key_change_me')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f"sqlite:///{BASE_DIR / 'instance' / 'travelmind.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # AI Keys encryption key
    AI_ENCRYPTION_KEY = os.environ.get('AI_ENCRYPTION_KEY', '')
    
    # Uploads path
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    
    # Create required directories
    os.makedirs(BASE_DIR / 'instance', exist_ok=True)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(BASE_DIR / 'data' / 'raw', exist_ok=True)
    os.makedirs(BASE_DIR / 'data' / 'processed', exist_ok=True)
