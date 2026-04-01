from fastapi import APIRouter, HTTPException, Header, Query, Depends
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id
from ..schemas.ingredient_schema import InventoryItemCreate, InventoryItemUpdate

router = APIRouter()


@router.get("/")
async def get_inventory(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    db = get_db()
    query = {"userId": user_id}
    skip = (page - 1) * limit
    cursor = db.inventory_items.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.inventory_items.count_documents(query)
    for item in items:
        item["_id"] = str(item["_id"])
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.post("/")
async def add_inventory_item(
    item_in: InventoryItemCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = item_in.model_dump()
    doc["userId"] = user_id
    doc["createdAt"] = now
    doc["updatedAt"] = now
    result = await db.inventory_items.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{item_id}")
async def update_inventory_item(
    item_id: str,
    item_in: InventoryItemUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    existing = await db.inventory_items.find_one({"_id": ObjectId(item_id), "userId": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    
    update = item_in.model_dump(exclude_unset=True)
    update["updatedAt"] = datetime.now(timezone.utc)
    await db.inventory_items.update_one({"_id": ObjectId(item_id)}, {"$set": update})
    doc = await db.inventory_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    result = await db.inventory_items.delete_one({"_id": ObjectId(item_id), "userId": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    return {"message": "deleted"}
