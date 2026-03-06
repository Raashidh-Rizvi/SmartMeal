from fastapi import APIRouter, HTTPException
from app.config.database import db
from app.schemas.meal_schedule_schema import MealSchedule
from bson import ObjectId

router = APIRouter()

collection = db["meal_schedules"]

# ✅ CREATE
@router.post("/")
def create_meal(schedule: MealSchedule):
    meal_dict = schedule.dict()

    # Do not allow more than one meal for the same date + meal_type
    existing = collection.find_one(
        {
            "user_id": meal_dict["user_id"],
            "meal_date": meal_dict["meal_date"],
            "meal_type": meal_dict["meal_type"],
        }
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a meal planned for this date and meal type.",
        )

    result = collection.insert_one(meal_dict)

    meal_dict["_id"] = str(result.inserted_id)
    return meal_dict


# ✅ READ
@router.get("/")
def get_meals():
    meals = list(collection.find())
    for meal in meals:
        meal["_id"] = str(meal["_id"])
    return meals


# ✅ UPDATE
@router.put("/{meal_id}")
def update_meal(meal_id: str, schedule: MealSchedule):

    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    updated_values = schedule.dict()

    # Prevent changing to a date+meal_type combination that already exists
    clash = collection.find_one(
        {
            "user_id": updated_values["user_id"],
            "meal_date": updated_values["meal_date"],
            "meal_type": updated_values["meal_type"],
            "_id": {"$ne": obj_id},
        }
    )
    if clash:
        raise HTTPException(
            status_code=400,
            detail="Another meal already exists for this date and meal type.",
        )

    result = collection.update_one(
        {"_id": obj_id},
        {"$set": updated_values}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")

    return {"message": "Meal updated"}


# ✅ DELETE
@router.delete("/{meal_id}")
def delete_meal(meal_id: str):

    try:
        obj_id = ObjectId(meal_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    result = collection.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")

    return {"message": "Meal deleted"}