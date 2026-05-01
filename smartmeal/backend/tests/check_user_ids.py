import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_users():
    mongodb_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "test")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client[db_name]
    users = await db.users.find().to_list(None)
    for user in users:
        print(f"ID: {user['_id']}, Type: {type(user['_id'])}, Email: {user.get('email')}")

if __name__ == "__main__":
    asyncio.run(check_users())
