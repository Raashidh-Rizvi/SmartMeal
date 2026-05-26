<<<<<<< HEAD
from pymongo import ASCENDING, TEXT
from app.db.database import get_db
=======
from .database import get_db
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
import logging

logger = logging.getLogger(__name__)

<<<<<<< HEAD
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
=======

async def create_indexes():
    db = get_db()
    if db is None:
        return
    try:
        await db.users.create_index("email", unique=True)
        await db.meal_schedules.create_index([("user_id", 1), ("meal_date", 1), ("meal_type", 1)])
        await db.recipes.create_index("title")
        await db.shopping_items.create_index("user_id")
        await db.inventory_items.create_index("userId")
        await db.notifications.create_index("userId")
        await db.notifications.create_index([("createdAt", -1)])
        logger.info("MongoDB indexes created.")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
