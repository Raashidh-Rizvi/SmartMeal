from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from jose import jwt, JWTError
from ..db.database import get_db
from ..core.config import settings
from ..schemas.ingredient_schema import InventoryItemCreate, InventoryItemUpdate

router = APIRouter()


def get_user_id(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        return "1"  # fallback for unauthenticated dev use
    try:
        token = authorization.split(" ", 1)[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload["sub"]
    except JWTError:
        return "1"


@router.get("/")
async def get_inventory(
    authorization: Optional[str] = Header(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    db = get_db()
    user_id = get_user_id(authorization)
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
    authorization: Optional[str] = Header(None)
):
    db = get_db()
    user_id = get_user_id(authorization)
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
    authorization: Optional[str] = Header(None)
):
    db = get_db()
    user_id = get_user_id(authorization)
    existing = await db.inventory_items.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    update = item_in.model_dump(exclude_unset=True)
    update["updatedAt"] = datetime.now(timezone.utc)
    await db.inventory_items.update_one({"_id": ObjectId(item_id)}, {"$set": update})
    doc = await db.inventory_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: str,
    authorization: Optional[str] = Header(None)
):
    db = get_db()
    result = await db.inventory_items.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "deleted"}
