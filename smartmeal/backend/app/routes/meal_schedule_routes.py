from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.meal_schedule_schema import MealSchedule
from app.db.database import get_db
from bson import ObjectId
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[dict])
async def get_meals():
    db = get_db()
    meals = await db.meal_schedules.find().to_list(1000)
    for meal in meals:
        meal["_id"] = str(meal["_id"])
    return meals

@router.post("/", response_model=dict)
async def create_meal(meal: MealSchedule):
    db = get_db()
    meal_dict = meal.model_dump()
    result = await db.meal_schedules.insert_one(meal_dict)
    return {"_id": str(result.inserted_id), **meal_dict}

@router.put("/{meal_id}", response_model=dict)
async def update_meal(meal_id: str, meal: MealSchedule):
    db = get_db()
    if not ObjectId.is_valid(meal_id):
        raise HTTPException(status_code=400, detail="Invalid meal ID")
    
    result = await db.meal_schedules.update_one(
        {"_id": ObjectId(meal_id)},
        {"$set": meal.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    return {"_id": meal_id, **meal.model_dump()}

@router.delete("/{meal_id}")
async def delete_meal(meal_id: str):
    db = get_db()
    if not ObjectId.is_valid(meal_id):
        raise HTTPException(status_code=400, detail="Invalid meal ID")
    
    result = await db.meal_schedules.delete_one({"_id": ObjectId(meal_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    return {"message": "Meal deleted successfully"}
