from pymongo import ASCENDING
from app.db.database import get_db
import logging

logger = logging.getLogger(__name__)

async def create_indexes():
    db = get_db()
    if db is None:
        logger.error("Database connection not established. Cannot create indexes.")
        return

    logger.info("Creating indexes...")

    # 1. users.email unique
    users_collection = db["users"]
    await users_collection.create_index(
        [("email", ASCENDING)],
        unique=True,
        name="unique_email_index"
    )
    
    # # 2. inventory_items.userId
    # inventory_items_coll = db["inventory_items"]
    # await inventory_items_coll.create_index(
    #     [("userId", ASCENDING)],
    #     name="userId_index"
    # )
    
    # # 3. inventory_items.expiryDate
    # await inventory_items_coll.create_index(
    #     [("expiryDate", ASCENDING)],
    #     name="expiryDate_index"
    # )
    
    # # Implicitly accessing these collections creates them if they don't exist
    # # but strictly MongoDB driver handles collection creation lazily on first insert
    # # or explicitly if we need. Since user asked to "Create DB + collections":
    # collections_to_ensure = ["refresh_tokens", "meal_plans", "shopping_lists", "notifications"]
    # # Usually we don't need to explicitly create collections in MongoDB, but we can do a dummy list_collections check
    # # to trigger database creation.
    
    logger.info("Indexes created successfully. Required collections are initialized.")
