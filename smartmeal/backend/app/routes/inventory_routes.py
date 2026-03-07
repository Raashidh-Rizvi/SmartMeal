from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from app.db.database import get_db
from app.models.user import UserInDB
from app.models.inventory_models import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def get_my_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_db()
    query = {"userId": str(current_user.id)}
        
    skip = (page - 1) * limit
    cursor = db["inventory_items"].find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db["inventory_items"].count_documents(query)
    
    for item in items:
        item["_id"] = str(item["_id"])
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/", response_model=InventoryItemResponse)
async def create_inventory_item(
    item_in: InventoryItemCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_db()
    
    now = datetime.now(timezone.utc)
    new_item = item_in.model_dump()
    new_item["userId"] = str(current_user.id)
    new_item["createdAt"] = now
    new_item["updatedAt"] = now
    
    result = await db["inventory_items"].insert_one(new_item)
    new_item["_id"] = str(result.inserted_id)
    
    return new_item

@router.put("/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: str,
    item_in: InventoryItemUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    # Verify ownership
    existing = await db["inventory_items"].find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing.get("userId") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")
        
    update_data = item_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
            
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    await db["inventory_items"].update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
        
    updated_item = await db["inventory_items"].find_one({"_id": ObjectId(item_id)})
    updated_item["_id"] = str(updated_item["_id"])
    
    return updated_item

@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    # Verify ownership
    existing = await db["inventory_items"].find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing.get("userId") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
        
    await db["inventory_items"].delete_one({"_id": ObjectId(item_id)})
        
    return {"message": "deleted"}
