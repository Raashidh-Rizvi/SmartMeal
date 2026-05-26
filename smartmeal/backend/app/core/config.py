import os
from dotenv import load_dotenv
<<<<<<< HEAD

load_dotenv()

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "smartmeal")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
=======
from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME") or os.getenv("DB_NAME", "smartmeal")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Email Settings
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME", "SmartMeal")
    EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL", "no-reply@smartmeal.com")

    # Azure OpenAI
    AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY", "")
    AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
    AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

settings = Settings()
