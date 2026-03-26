from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..db.database import get_db

router = APIRouter()


class LeftoverCreate(BaseModel):
    name: str
    quantity: Optional[float] = 1
    unit: Optional[str] = ""
    notes: Optional[str] = ""
    expiry_date: Optional[datetime] = None
    user_id: Optional[str] = "1"


class LeftoverUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    expiry_date: Optional[datetime] = None


@router.get("/api/leftovers")
async def get_leftovers(include_used: bool = False):
    db = get_db()
    query = {"user_id": "1"}
    if not include_used:
        query["used"] = {"$ne": True}
    cursor = db.leftovers.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/api/leftovers/expiring-soon")
async def get_expiring_soon(days: int = 3):
    db = get_db()
    cutoff = datetime.now(timezone.utc) + timedelta(days=days)
    cursor = db.leftovers.find({
        "user_id": "1",
        "used": {"$ne": True},
        "expiry_date": {"$lte": cutoff}
    })
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/api/leftovers/{item_id}")
async def get_leftover(item_id: str):
    db = get_db()
    item = await db.leftovers.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item["_id"] = str(item["_id"])
    return item


@router.post("/api/leftovers/")
async def create_leftover(data: LeftoverCreate):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = data.model_dump()
    doc["created_at"] = now
    doc["used"] = False
    result = await db.leftovers.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/api/leftovers/{item_id}")
async def update_leftover(item_id: str, data: LeftoverUpdate):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    await db.leftovers.update_one({"_id": ObjectId(item_id)}, {"$set": update})
    item = await db.leftovers.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item["_id"] = str(item["_id"])
    return item


@router.patch("/api/leftovers/{item_id}/mark-used")
async def mark_used(item_id: str):
    db = get_db()
    await db.leftovers.update_one({"_id": ObjectId(item_id)}, {"$set": {"used": True}})
    item = await db.leftovers.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item["_id"] = str(item["_id"])
    return item


@router.delete("/api/leftovers/{item_id}")
async def delete_leftover(item_id: str):
    db = get_db()
    result = await db.leftovers.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "deleted"}
