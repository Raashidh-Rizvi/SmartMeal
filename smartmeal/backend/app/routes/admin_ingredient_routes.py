from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from ..db.database import get_db
from ..schemas.ingredient_schema import IngredientCreate, IngredientUpdate

router = APIRouter()


@router.get("/ingredients")
async def admin_list_ingredients():
    db = get_db()
    cursor = db.ingredients.find({})
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.post("/ingredients")
async def admin_create_ingredient(data: IngredientCreate):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = data.model_dump()
    doc["createdAt"] = now
    doc["updatedAt"] = now
    result = await db.ingredients.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/ingredients/{ingredient_id}")
async def admin_update_ingredient(ingredient_id: str, data: IngredientUpdate):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    update["updatedAt"] = datetime.now(timezone.utc)
    result = await db.ingredients.update_one({"_id": ObjectId(ingredient_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    doc = await db.ingredients.find_one({"_id": ObjectId(ingredient_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/ingredients/{ingredient_id}")
async def admin_delete_ingredient(ingredient_id: str):
    db = get_db()
    result = await db.ingredients.delete_one({"_id": ObjectId(ingredient_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return {"message": "deleted"}
