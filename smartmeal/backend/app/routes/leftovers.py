from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..db.database import get_db

router = APIRouter()


def calculate_days_until_expiry(expiry_date) -> int:
    if not expiry_date:
        return 0
    if isinstance(expiry_date, str):
        expiry_date = datetime.fromisoformat(expiry_date.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    if expiry_date.tzinfo is None:
        expiry_date = expiry_date.replace(tzinfo=timezone.utc)
    return (expiry_date - now).days


def leftover_helper(leftover: dict) -> dict:
    return {
        "id": str(leftover["_id"]),
        "name": leftover["name"],
        "quantity": leftover.get("quantity", ""),
        "category": leftover.get("category", ""),
        "cooked_date": leftover.get("cooked_date"),
        "expiry_date": leftover.get("expiry_date"),
        "storage_location": leftover.get("storage_location", "fridge"),
        "notes": leftover.get("notes"),
        "image_url": leftover.get("image_url"),
        "ingredients": leftover.get("ingredients", []),
        "is_used": leftover.get("is_used", False),
        "created_at": leftover.get("created_at"),
        "days_until_expiry": calculate_days_until_expiry(leftover.get("expiry_date")),
    }


class LeftoverCreate(BaseModel):
    name: str
    quantity: Optional[str] = "1 servings"
    category: Optional[str] = ""
    cooked_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[str] = "fridge"
    notes: Optional[str] = ""
    image_url: Optional[str] = None
    ingredients: Optional[List[str]] = []
    user_id: Optional[str] = "1"


class LeftoverUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[str] = None
    category: Optional[str] = None
    cooked_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    ingredients: Optional[List[str]] = None


@router.get("/api/leftovers")
async def get_leftovers(include_used: bool = False):
    db = get_db()
    query = {"user_id": "1"}
    if not include_used:
        query["is_used"] = {"$ne": True}
    cursor = db.leftovers.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    return [leftover_helper(item) for item in items]


@router.get("/api/leftovers/expiring-soon")
async def get_expiring_soon(days: int = 3):
    db = get_db()
    cutoff = datetime.now(timezone.utc) + timedelta(days=days)
    cursor = db.leftovers.find({
        "user_id": "1",
        "is_used": {"$ne": True},
        "expiry_date": {"$lte": cutoff}
    })
    items = await cursor.to_list(length=None)
    return [leftover_helper(item) for item in items]


@router.get("/api/leftovers/{item_id}")
async def get_leftover(item_id: str):
    db = get_db()
    item = await db.leftovers.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return leftover_helper(item)


@router.post("/api/leftovers/")
async def create_leftover(data: LeftoverCreate):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = data.model_dump()
    doc["created_at"] = now
    doc["is_used"] = False
    result = await db.leftovers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return leftover_helper(doc)


@router.put("/api/leftovers/{item_id}")
async def update_leftover(item_id: str, data: LeftoverUpdate):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    await db.leftovers.update_one({"_id": ObjectId(item_id)}, {"$set": update})
    item = await db.leftovers.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return leftover_helper(item)


@router.patch("/api/leftovers/{item_id}/mark-used")
async def mark_used(item_id: str):
    db = get_db()
    await db.leftovers.update_one({"_id": ObjectId(item_id)}, {"$set": {"is_used": True}})
    item = await db.leftovers.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return leftover_helper(item)


@router.delete("/api/leftovers/{item_id}")
async def delete_leftover(item_id: str):
    db = get_db()
    result = await db.leftovers.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "deleted"}
