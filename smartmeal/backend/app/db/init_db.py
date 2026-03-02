from pymongo import ASCENDING
from app.db.database import get_db
import logging

logger = logging.getLogger(__name__)

async def create_indexes():
    db = get_db()
    if db is None:
        logger.warning("Database not ready — skipping index creation.")
        return

    try:
        logger.info("Creating indexes...")
        users_collection = db["users"]
        await users_collection.create_index(
            [("email", ASCENDING)],
            unique=True,
            name="unique_email_index"
        )
        logger.info("Indexes created successfully.")
    except Exception as e:
        # Don't crash startup if Atlas is slow or temporarily unavailable
        logger.warning(f"Could not create indexes (will retry on next start): {e}")
