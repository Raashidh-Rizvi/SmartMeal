import sys
import os
import asyncio
from datetime import datetime, timezone

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import connect_to_mongo, close_mongo_connection, get_db
from app.core.security import get_password_hash
from app.models.user import UserPreferences

async def seed_admin():
    print("Connecting to database...")
    await connect_to_mongo()
    db = get_db()
    
    admin_email = "admin@smartmeal.com"
    admin_password = "adminpassword123"
    
    existing_admin = await db["users"].find_one({"email": admin_email})
    
    if existing_admin:
        print(f"Admin user {admin_email} already exists!")
    else:
        print("Creating admin user...")
        # Note: model_dump() is preferred in newer pydantic, using dict() for compatibility
        admin_doc = {
            "name": "Super Admin",
            "email": admin_email,
            "role": "ADMIN",
            "preferences": UserPreferences().dict() if hasattr(UserPreferences(), 'dict') else UserPreferences().model_dump(),
            "password_hash": get_password_hash(admin_password),
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        await db["users"].insert_one(admin_doc)
        print(f"Admin user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print("Please change this password after your first login.")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_admin())
