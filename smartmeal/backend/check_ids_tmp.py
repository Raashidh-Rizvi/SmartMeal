import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.smartmeal
    async for u in db.users.find({}, {'_id': 1, 'email': 1}):
        print(f"User _id: {u['_id']}, type: {type(u['_id'])}, str: {str(u['_id'])}, len: {len(str(u['_id']))}")

if __name__ == "__main__":
    asyncio.run(check())
