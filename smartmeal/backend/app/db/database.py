from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
<<<<<<< HEAD
    db_instance.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
    )
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
    logger.info("Connected to MongoDB successfully.")
=======
    uri = settings.MONGODB_URI.strip()
    db_instance.client = AsyncIOMotorClient(
        uri, 
        serverSelectionTimeoutMS=15000,
        connectTimeoutMS=10000,
        heartbeatFrequencyMS=10000
    )
    # Ping the server to ensure connection is actually established
    try:
        await db_instance.client.admin.command('ping')
        db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
        logger.info("Connected to MongoDB successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_instance.client is not None:
        db_instance.client.close()
        db_instance.client = None
    logger.info("Closed MongoDB connection.")

def get_db():
    return db_instance.db
