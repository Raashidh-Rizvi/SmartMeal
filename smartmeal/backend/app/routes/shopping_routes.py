from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id

router = APIRouter()


class ShoppingItemCreate(BaseModel):
    name: str
    quantity: Optional[float] = 1
    unit: Optional[str] = ""
    category: Optional[str] = ""
    notes: Optional[str] = ""
    status: Optional[str] = "pending"


class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@router.get("/shopping/all")
async def get_items(
    user_id: str = Depends(get_current_user_id),
    status_filter: Optional[str] = None
):
    db = get_db()
    query = {"user_id": user_id}
    if status_filter:
        query["status"] = status_filter
    cursor = db.shopping_items.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/shopping/stats")
async def get_stats(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    total = await db.shopping_items.count_documents({"user_id": user_id})
    bought = await db.shopping_items.count_documents({"user_id": user_id, "status": "bought"})
    pending = await db.shopping_items.count_documents({"user_id": user_id, "status": "pending"})
    return {"total": total, "bought": bought, "pending": pending}


@router.post("/shopping/add")
async def add_item(
    item: ShoppingItemCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = item.model_dump()
    doc["user_id"] = user_id
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.shopping_items.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/shopping/update/{item_id}")
async def update_item(
    item_id: str,
    item: ShoppingItemUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    update = item.model_dump(exclude_unset=True)
    update["updated_at"] = datetime.now(timezone.utc)
    # Ensure item belongs to user
    result = await db.shopping_items.update_one(
        {"_id": ObjectId(item_id), "user_id": user_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.patch("/shopping/mark-bought/{item_id}")
async def mark_bought(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    result = await db.shopping_items.update_one(
        {"_id": ObjectId(item_id), "user_id": user_id},
        {"$set": {"status": "bought", "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/shopping/delete/{item_id}")
async def delete_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    result = await db.shopping_items.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    return {"message": "deleted"}


@router.delete("/shopping/clear-bought")
async def clear_bought(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = await db.shopping_items.delete_many({"user_id": user_id, "status": "bought"})
    return {"deleted": result.deleted_count}
