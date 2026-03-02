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
    db_instance.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
    )
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
    logger.info("Connected to MongoDB successfully.")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_instance.client is not None:
        db_instance.client.close()
        db_instance.client = None
    logger.info("Closed MongoDB connection.")

def get_db():
    return db_instance.db
