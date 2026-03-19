from pymongo import ASCENDING, TEXT
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

        # 1. users.email unique
        users_collection = db["users"]
        await users_collection.create_index(
            [("email", ASCENDING)],
            unique=True,
            name="unique_email_index"
        )

        # 2. recipes — text index for search on title + description
        recipes_collection = db["recipes"]
        await recipes_collection.create_index(
            [("title", TEXT), ("description", TEXT)],
            name="recipe_text_search_index"
        )

        # 3. recipes — field indexes for filtering
        await recipes_collection.create_index(
            [("category", ASCENDING)],
            name="recipe_category_index"
        )
        await recipes_collection.create_index(
            [("created_by", ASCENDING)],
            name="recipe_created_by_index"
        )
        await recipes_collection.create_index(
            [("created_at", ASCENDING)],
            name="recipe_created_at_index"
        )
        
        logger.info("Indexes created successfully. Required collections are initialized.")
    except Exception as e:
        # Don't crash startup if Atlas is slow or temporarily unavailable
        logger.warning(f"Could not create indexes (will retry on next start): {e}")
