import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("MONGODB_URI is not set!")
        return
    # mask password
    parts = uri.split("@")
    if len(parts) > 1:
        masked_uri = "mongodb+srv://***:***@" + parts[1]
    else:
        masked_uri = uri
    print(f"Testing connection to: {masked_uri}")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
    try:
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
