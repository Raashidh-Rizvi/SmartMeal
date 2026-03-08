"""
Shopping Service
Business logic layer for shopping list operations.
Keeps route handlers thin by centralising DB interactions here.
Uses snake_case to match Python backend conventions.
"""

from bson import ObjectId
from datetime import datetime
from typing import List, Optional

from app.models.shopping_model import ShoppingItemCreate, ShoppingItemUpdate, ItemSource
from app.config.database import get_collection

# MongoDB collection name - use snake_case for consistency
SHOPPING_COLLECTION = "shopping_items"


def serialize_item(item) -> dict:
    """Convert a MongoDB document to a JSON-serialisable dict."""
    if item is None:
        return None
    return {
        "id":         str(item.get("_id", "")),
        "user_id":    item.get("user_id", ""),
        "item_name":  item.get("item_name", ""),
        "quantity":   item.get("quantity", 1),
        "unit":       item.get("unit", "piece"),
        "status":     item.get("status", "Pending"),
        "source":     item.get("source", "Manual"),
        "created_at": (
            item.get("created_at", datetime.utcnow()).isoformat()
            if isinstance(item.get("created_at"), datetime)
            else item.get("created_at")
        ),
    }


async def get_all_items(user_id: str, status_filter: Optional[str] = None) -> List[dict]:
    """Return all shopping items for a user, optionally filtered by status."""
    collection = get_collection(SHOPPING_COLLECTION)
    query = {"user_id": user_id}
    if status_filter:
        query["status"] = status_filter
    items = await collection.find(query).sort("created_at", -1).to_list(length=100)
    return [serialize_item(i) for i in items]


async def get_pending_items(user_id: str) -> List[dict]:
    """Return all pending items for a user."""
    collection = get_collection(SHOPPING_COLLECTION)
    items = await collection.find(
        {"user_id": user_id, "status": "Pending"}
    ).sort("created_at", -1).to_list(length=100)
    return [serialize_item(i) for i in items]


async def get_bought_items(user_id: str) -> List[dict]:
    """Return all bought items for a user."""
    collection = get_collection(SHOPPING_COLLECTION)
    items = await collection.find(
        {"user_id": user_id, "status": "Bought"}
    ).sort("created_at", -1).to_list(length=100)
    return [serialize_item(i) for i in items]


async def add_item(item: ShoppingItemCreate) -> dict:
    """
    Add a new shopping item.
    If a pending item with the same name already exists for the user,
    the quantity is merged instead of creating a duplicate.
    """
    collection = get_collection(SHOPPING_COLLECTION)

    # Duplicate check (case-insensitive)
    existing = await collection.find_one({
        "user_id":   item.user_id,
        "item_name": {"$regex": f"^{item.item_name}$", "$options": "i"},
        "status":    "Pending",
    })

    if existing:
        new_qty = existing.get("quantity", 0) + item.quantity
        await collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"quantity": new_qty}}
        )
        updated = await collection.find_one({"_id": existing["_id"]})
        return serialize_item(updated)

    new_doc = {
        "user_id":    item.user_id,
        "item_name":  item.item_name,
        "quantity":   item.quantity,
        "unit":       item.unit,
        "status":     "Pending",
        "source":     item.source.value if isinstance(item.source, ItemSource) else item.source,
        "created_at": datetime.utcnow(),
    }
    result = await collection.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id
    return serialize_item(new_doc)


async def update_item(item_id: str, update_data: ShoppingItemUpdate) -> Optional[dict]:
    """Update fields on an existing shopping item. Returns None if not found."""
    collection = get_collection(SHOPPING_COLLECTION)

    try:
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    except AttributeError:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}

    if not update_dict:
        return None  # caller should raise 400

    result = await collection.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": update_dict},
        return_document=True,
    )
    return serialize_item(result) if result else None


async def mark_item_bought(item_id: str) -> Optional[dict]:
    """Mark a single item as Bought. Returns None if not found."""
    collection = get_collection(SHOPPING_COLLECTION)
    result = await collection.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": {"status": "Bought"}},
        return_document=True,
    )
    return serialize_item(result) if result else None


async def delete_item(item_id: str) -> bool:
    """Delete a shopping item. Returns True if deleted, False if not found."""
    collection = get_collection(SHOPPING_COLLECTION)
    result = await collection.delete_one({"_id": ObjectId(item_id)})
    return result.deleted_count > 0


async def get_stats(user_id: str) -> dict:
    """Return aggregate statistics for a user's shopping list."""
    collection = get_collection(SHOPPING_COLLECTION)
    total         = await collection.count_documents({"user_id": user_id})
    pending       = await collection.count_documents({"user_id": user_id, "status": "Pending"})
    bought        = await collection.count_documents({"user_id": user_id, "status": "Bought"})
    manual_count  = await collection.count_documents({"user_id": user_id, "source": "Manual"})
    meal_plan_count = await collection.count_documents({"user_id": user_id, "source": "MealPlan"})

    return {
        "total":   total,
        "pending": pending,
        "bought":  bought,
        "source_breakdown": {
            "manual":     manual_count,
            "meal_plan":  meal_plan_count,
        },
    }


async def add_items_from_meal_plan(user_id: str, items: list) -> dict:
    """
    Batch-add items from a meal plan.
    Merges quantities for existing pending items; creates new ones otherwise.
    """
    collection = get_collection(SHOPPING_COLLECTION)
    added_items   = []
    updated_items = []

    for item in items:
        existing = await collection.find_one({
            "user_id":   item.user_id,
            "item_name": {"$regex": f"^{item.item_name}$", "$options": "i"},
            "status":    "Pending",
        })

        if existing:
            new_qty = existing.get("quantity", 0) + item.quantity
            await collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty}}
            )
            updated_items.append(
                serialize_item(await collection.find_one({"_id": existing["_id"]}))
            )
        else:
            new_doc = {
                "user_id":    item.user_id,
                "item_name":  item.item_name,
                "quantity":   item.quantity,
                "unit":       item.unit,
                "status":     "Pending",
                "source":     "MealPlan",
                "created_at": datetime.utcnow(),
            }
            result = await collection.insert_one(new_doc)
            new_doc["_id"] = result.inserted_id
            added_items.append(serialize_item(new_doc))

    return {
        "added":         added_items,
        "updated":       updated_items,
        "total_added":   len(added_items),
        "total_updated": len(updated_items),
    }


async def clear_bought_items(user_id: str) -> dict:
    """Delete all bought items for a user. Returns deletion count."""
    collection = get_collection(SHOPPING_COLLECTION)
    result = await collection.delete_many({"user_id": user_id, "status": "Bought"})
    return {"message": f"Deleted {result.deleted_count} bought items"}
