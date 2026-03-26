from fastapi import APIRouter, HTTPException
from bson import ObjectId
from ..db.database import get_db

router = APIRouter()


@router.get("/users")
async def list_users():
    db = get_db()
    cursor = db.users.find({})
    users = await cursor.to_list(length=None)
    for u in users:
        u["_id"] = str(u["_id"])
        u.pop("hashed_password", None)
    return users


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("hashed_password", None)
    return user


@router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict):
    db = get_db()
    data.pop("_id", None)
    data.pop("hashed_password", None)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": data})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    user["_id"] = str(user["_id"])
    user.pop("hashed_password", None)
    return user


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.get("/metrics")
async def get_metrics():
    db = get_db()
    return {
        "total_users": await db.users.count_documents({}),
        "total_recipes": await db.recipes.count_documents({}),
        "total_meals": await db.meal_schedules.count_documents({}),
        "total_inventory": await db.inventory_items.count_documents({}),
    }


@router.get("/inventory")
async def admin_inventory():
    db = get_db()
    cursor = db.inventory_items.find({})
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/notifications")
async def get_notifications():
    return []
