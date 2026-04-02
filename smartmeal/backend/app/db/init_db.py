from .database import get_db
import logging

logger = logging.getLogger(__name__)


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
