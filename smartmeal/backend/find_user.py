import asyncio
from app.db.database import connect_to_mongo, close_mongo_connection, get_db

async def check_user():
    await connect_to_mongo()
    db = get_db()
    user = await db.users.find_one({"email": "raashidh24@gmail.com"})
    if user:
        print(f"User found: ID={user['_id']}")
    else:
        print("User NOT found")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_user())
