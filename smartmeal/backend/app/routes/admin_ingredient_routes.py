from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.db.database import get_db
from app.models.user import UserInDB
from app.models.ingredient import IngredientCreate, IngredientUpdate, IngredientResponse
from app.api.deps import require_admin

router = APIRouter()

@router.get("/ingredients")
async def get_ingredients(
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserInDB = Depends(require_admin)
):
    db = get_db()
    query = {}
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if category:
        query["category"] = category
        
    skip = (page - 1) * limit
    cursor = db["ingredients"].find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db["ingredients"].count_documents(query)
    
    for item in items:
        item["_id"] = str(item["_id"])
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/ingredients", response_model=IngredientResponse)
async def create_ingredient(
    ingredient_in: IngredientCreate,
    current_user: UserInDB = Depends(require_admin)
):
    db = get_db()
    
    # Check if ingredient with same name already exists
    existing = await db["ingredients"].find_one({"name": {"$regex": f"^{ingredient_in.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Ingredient with this name already exists")
        
    now = datetime.now(timezone.utc)
    new_ingredient = ingredient_in.model_dump()
    new_ingredient["createdAt"] = now
    new_ingredient["updatedAt"] = now
    
    result = await db["ingredients"].insert_one(new_ingredient)
    new_ingredient["_id"] = str(result.inserted_id)
    
    return new_ingredient

@router.put("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: str,
    ingredient_in: IngredientUpdate,
    current_user: UserInDB = Depends(require_admin)
):
    db = get_db()
    if not ObjectId.is_valid(ingredient_id):
        raise HTTPException(status_code=400, detail="Invalid ingredient ID")
        
    update_data = ingredient_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
        
    # Check name collisions if updating name
    if "name" in update_data:
        existing = await db["ingredients"].find_one({
            "name": {"$regex": f"^{update_data['name']}$", "$options": "i"},
            "_id": {"$ne": ObjectId(ingredient_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Another ingredient with this name already exists")
            
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    result = await db["ingredients"].update_one(
        {"_id": ObjectId(ingredient_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    updated_ingredient = await db["ingredients"].find_one({"_id": ObjectId(ingredient_id)})
    updated_ingredient["_id"] = str(updated_ingredient["_id"])
    
    return updated_ingredient

@router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(
    ingredient_id: str,
    current_user: UserInDB = Depends(require_admin)
):
    db = get_db()
    if not ObjectId.is_valid(ingredient_id):
        raise HTTPException(status_code=400, detail="Invalid ingredient ID")
        
    result = await db["ingredients"].delete_one({"_id": ObjectId(ingredient_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    return {"message": "deleted"}
