from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id
from ..schemas.meal_schedule_schema import (
    MealScheduleCreate, MealScheduleUpdate, MealScheduleResponse,
    MealStatus, MealType
)
from typing import List, Optional

router = APIRouter()


async def check_inventory(db, recipe_id: str, user_id: str, servings: int = 1):
    warnings = []
    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not recipe:
            return ["Recipe not found"]
        for ing in recipe.get("ingredients", []):
            ing_name = ing["name"]
            required_qty = ing["quantity"] * servings
            inventory = await db.inventory_items.find_one({
                "name": {"$regex": f"^{ing_name}$", "$options": "i"},
                "userId": user_id
            })
            if not inventory:
                warnings.append(f"Ingredient '{ing_name}' not in inventory")
            elif inventory["quantity"] < required_qty:
                warnings.append(
                    f"Insufficient {ing_name}: have {inventory['quantity']}, "
                    f"need {required_qty} for {servings} serving{'s' if servings > 1 else ''}"
                )
    except Exception as e:
        warnings.append(f"Error checking inventory: {str(e)}")
    return warnings


async def get_meal_with_recipe_details(db, meal_doc: dict, user_id: str) -> MealScheduleResponse:
    if "_id" in meal_doc and not isinstance(meal_doc["_id"], str):
        meal_doc["_id"] = str(meal_doc["_id"])

    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(meal_doc["recipe_id"])})
        if recipe:
            meal_doc["recipe_title"] = recipe.get("title", "Unknown Recipe")
            meal_doc["recipe_category"] = recipe.get("category", "Unknown")
            total_calories = 0
            for ing in recipe.get("ingredients", []):
                ing_qty = ing["quantity"] * meal_doc.get("servings", 1)
                base_ing = await db.ingredients.find_one(
                    {"name": {"$regex": f"^{ing['name']}$", "$options": "i"}}
                )
                if base_ing and base_ing.get("calories"):
                    total_calories += base_ing["calories"] * ing_qty
            meal_doc["total_calories_estimate"] = int(total_calories) if total_calories > 0 else None
        else:
            meal_doc["recipe_title"] = "Recipe Not Found"
            meal_doc["recipe_category"] = "Unknown"
            meal_doc["total_calories_estimate"] = None
    except Exception:
        meal_doc["recipe_title"] = "Error Loading Recipe"
        meal_doc["recipe_category"] = "Unknown"
        meal_doc["total_calories_estimate"] = None

    meal_doc["warnings"] = await check_inventory(db, meal_doc["recipe_id"], user_id, meal_doc.get("servings", 1))
    return MealScheduleResponse(**meal_doc)


@router.post("/", response_model=MealScheduleResponse)
async def create_meal(
    schedule: MealScheduleCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(schedule.recipe_id)})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

    existing = await db.meal_schedules.find_one({
        "user_id": user_id,
        "meal_date": schedule.meal_date.isoformat(),
        "meal_type": schedule.meal_type.value,
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a meal planned for this date and meal type.")

    now = datetime.now(timezone.utc)
    meal_dict = schedule.model_dump()
    meal_dict["user_id"] = user_id
    meal_dict["meal_date"] = schedule.meal_date.isoformat()
    meal_dict["meal_type"] = schedule.meal_type.value
    meal_dict["status"] = schedule.status.value
    meal_dict["created_at"] = now
    meal_dict["updated_at"] = now

    result = await db.meal_schedules.insert_one(meal_dict)
    created_meal = await db.meal_schedules.find_one({"_id": result.inserted_id})
    return await get_meal_with_recipe_details(db, created_meal, user_id)


@router.get("/")
async def get_meals(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    try:
        cursor = db.meal_schedules.find({"user_id": user_id})
        meals = await cursor.to_list(length=None)
        enriched = []
        for meal in meals:
            try:
                meal["_id"] = str(meal["_id"])
                try:
                    recipe = await db.recipes.find_one({"_id": ObjectId(meal.get("recipe_id"))})
                    meal["recipe_title"] = recipe.get("title", "Unknown Recipe") if recipe else "Recipe Not Found"
                except Exception:
                    meal["recipe_title"] = "Unknown Recipe"
                meal["warnings"] = await check_inventory(db, meal.get("recipe_id", ""), user_id, meal.get("servings", 1))
                enriched.append(meal)
            except Exception as e:
                print(f"Error enriching meal {meal.get('_id')}: {e}")
        return enriched
    except Exception as e:
        print(f"Error fetching meals: {e}")
        return []


@router.put("/{meal_id}", response_model=MealScheduleResponse)
async def update_meal(
    meal_id: str,
    schedule: MealScheduleUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meal ID")

    existing = await db.meal_schedules.find_one({"_id": obj_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Meal not found or unauthorized")

    update_fields = schedule.model_dump(exclude_unset=True)

    if "meal_date" in update_fields and update_fields["meal_date"]:
        update_fields["meal_date"] = update_fields["meal_date"].isoformat()
    if "meal_type" in update_fields and update_fields["meal_type"]:
        update_fields["meal_type"] = update_fields["meal_type"].value
    if "status" in update_fields and update_fields["status"]:
        update_fields["status"] = update_fields["status"].value
        if update_fields["status"] == "done":
            update_fields["completed_at"] = datetime.now(timezone.utc)

    if "meal_date" in update_fields or "meal_type" in update_fields:
        new_date = update_fields.get("meal_date", existing["meal_date"])
        new_type = update_fields.get("meal_type", existing["meal_type"])
        clash = await db.meal_schedules.find_one({
            "user_id": user_id,
            "meal_date": new_date,
            "meal_type": new_type,
            "_id": {"$ne": obj_id},
        })
        if clash:
            raise HTTPException(status_code=400, detail="Another meal already exists for this date and meal type.")

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db.meal_schedules.update_one({"_id": obj_id, "user_id": user_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found or unauthorized")

    updated = await db.meal_schedules.find_one({"_id": obj_id})
    return await get_meal_with_recipe_details(db, updated, user_id)


@router.delete("/{meal_id}")
async def delete_meal(
    meal_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meal ID")

    result = await db.meal_schedules.delete_one({"_id": obj_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found or unauthorized")

    return {"message": "Meal deleted successfully"}
