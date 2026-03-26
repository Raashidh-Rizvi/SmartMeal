from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from ..config.database import db
from ..schemas.ingredient_schema import IngredientCreate, IngredientUpdate, IngredientResponse, InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse

router = APIRouter()

# Base ingredients routes (admin)
@router.get("/base")
async def get_ingredients(
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    query = {}
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if category:
        query["category"] = category
        
    skip = (page - 1) * limit
    cursor = db.ingredients.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.ingredients.count_documents(query)
    
    for item in items:
        item["_id"] = str(item["_id"])
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/base", response_model=IngredientResponse)
async def create_ingredient(ingredient_in: IngredientCreate):
    # Check if ingredient with same name already exists
    existing = await db.ingredients.find_one({"name": {"$regex": f"^{ingredient_in.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Ingredient with this name already exists")
        
    now = datetime.now(timezone.utc)
    new_ingredient = ingredient_in.model_dump()
    new_ingredient["createdAt"] = now
    new_ingredient["updatedAt"] = now
    
    result = await db.ingredients.insert_one(new_ingredient)
    new_ingredient["_id"] = str(result.inserted_id)
    
    return new_ingredient

@router.put("/base/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(ingredient_id: str, ingredient_in: IngredientUpdate):
    if not ObjectId.is_valid(ingredient_id):
        raise HTTPException(status_code=400, detail="Invalid ingredient ID")
        
    update_data = ingredient_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
        
    # Check name collisions if updating name
    if "name" in update_data:
        existing = await db.ingredients.find_one({
            "name": {"$regex": f"^{update_data['name']}$", "$options": "i"},
            "_id": {"$ne": ObjectId(ingredient_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Another ingredient with this name already exists")
            
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    result = await db.ingredients.update_one(
        {"_id": ObjectId(ingredient_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    updated_ingredient = await db.ingredients.find_one({"_id": ObjectId(ingredient_id)})
    updated_ingredient["_id"] = str(updated_ingredient["_id"])
    
    return updated_ingredient

@router.delete("/base/{ingredient_id}")
async def delete_ingredient(ingredient_id: str):
    if not ObjectId.is_valid(ingredient_id):
        raise HTTPException(status_code=400, detail="Invalid ingredient ID")
        
    result = await db.ingredients.delete_one({"_id": ObjectId(ingredient_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    return {"message": "deleted"}

# Inventory routes
from app.schemas.ingredient_schema import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse

@router.get("/", response_model=dict)
async def get_my_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    query = {"userId": "1"}  # Mock user
        
    skip = (page - 1) * limit
    cursor = db.inventory_items.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.inventory_items.count_documents(query)
    
    for item in items:
        item["_id"] = str(item["_id"])
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/", response_model=InventoryItemResponse)
async def create_inventory_item(item_in: InventoryItemCreate):
    now = datetime.now(timezone.utc)
    new_item = item_in.model_dump()
    new_item["userId"] = "1"  # Mock user
    new_item["createdAt"] = now
    new_item["updatedAt"] = now
    
    result = await db.inventory_items.insert_one(new_item)
    new_item["_id"] = str(result.inserted_id)
    
    return new_item

@router.put("/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: str, item_in: InventoryItemUpdate):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    # Verify ownership
    existing = await db.inventory_items.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing.get("userId") != "1":  # Mock
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")

    update_data = item_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
            
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    await db.inventory_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
        
    updated_item = await db.inventory_items.find_one({"_id": ObjectId(item_id)})
    updated_item["_id"] = str(updated_item["_id"])
    
    return updated_item

@router.delete("/{item_id}")
async def delete_inventory_item(item_id: str):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    # Verify ownership
    existing = await db.inventory_items.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing.get("userId") != "1":  # Mock
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
        
    await db.inventory_items.delete_one({"_id": ObjectId(item_id)})
        
    return {"message": "deleted"}