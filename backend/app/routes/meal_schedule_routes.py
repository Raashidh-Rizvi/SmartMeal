from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
from ..config.database import db
from ..schemas.meal_schedule_schema import (
    MealScheduleCreate, MealScheduleUpdate, MealScheduleResponse,
    MealStatus, MealType  # Add MealType to imports
)
from typing import List, Optional
from fastapi import Query

router = APIRouter()

meal_collection = db["meal_schedules"]

async def check_inventory(recipe_id: str, servings: int = 1):
    """Check inventory for recipe ingredients and return warnings."""
    warnings = []
    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not recipe:
            return ["Recipe not found"]

        for ing in recipe.get("ingredients", []):
            ing_name = ing["name"]
            required_qty = ing["quantity"] * servings  # Scale by servings
            inventory = await db.inventory_items.find_one({
                "name": {"$regex": f"^{ing_name}$", "$options": "i"},
                "userId": "1"  # Mock user - should be dynamic
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

async def get_meal_with_recipe_details(meal_doc: dict) -> MealScheduleResponse:
    """Enrich meal document with recipe details and computed fields."""
    # Convert ObjectId to string
    if "_id" in meal_doc and not isinstance(meal_doc["_id"], str):
        meal_doc["_id"] = str(meal_doc["_id"])
    
    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(meal_doc["recipe_id"])})
        if recipe:
            meal_doc["recipe_title"] = recipe.get("title", "Unknown Recipe")
            meal_doc["recipe_category"] = recipe.get("category", "Unknown")

            # Calculate total calories estimate
            total_calories = 0
            for ing in recipe.get("ingredients", []):
                ing_name = ing["name"]
                ing_qty = ing["quantity"] * meal_doc.get("servings", 1)

                # Find ingredient calories
                base_ing = await db.ingredients.find_one({
                    "name": {"$regex": f"^{ing_name}$", "$options": "i"}
                })
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

    # Check inventory warnings
    meal_doc["warnings"] = await check_inventory(
        meal_doc["recipe_id"],
        meal_doc.get("servings", 1)
    )

    return MealScheduleResponse(**meal_doc)

# ✅ CREATE
@router.post("/", response_model=MealScheduleResponse)
async def create_meal(schedule: MealScheduleCreate):
    # Validate that recipe exists
    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(schedule.recipe_id)})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

    # Do not allow more than one meal for the same date + meal_type + user
    existing = await meal_collection.find_one({
        "user_id": schedule.user_id,
        "meal_date": schedule.meal_date.isoformat(),
        "meal_type": schedule.meal_type.value,
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a meal planned for this date and meal type.",
        )

    now = datetime.now(timezone.utc)
    meal_dict = schedule.model_dump()
    meal_dict["meal_date"] = schedule.meal_date.isoformat()  # Convert date to string for MongoDB
    meal_dict["meal_type"] = schedule.meal_type.value  # Convert enum to string
    meal_dict["status"] = schedule.status.value  # Convert enum to string
    meal_dict["created_at"] = now
    meal_dict["updated_at"] = now

    result = await meal_collection.insert_one(meal_dict)
    created_meal = await meal_collection.find_one({"_id": result.inserted_id})

    # Return enriched response
    return await get_meal_with_recipe_details(created_meal)

# ✅ READ
@router.get("/")
async def get_meals(user_id: str = "1"):
    """Get all meals for a user with enriched data."""
    try:
        cursor = meal_collection.find({"user_id": user_id})
        meals = await cursor.to_list(length=None)
        
        # Enrich each meal with recipe details
        enriched_meals = []
        for meal in meals:
            try:
                # Convert ObjectId to string for _id
                meal["_id"] = str(meal["_id"])
                
                # Get recipe title if exists
                try:
                    recipe = await db.recipes.find_one({"_id": ObjectId(meal.get("recipe_id"))})
                    if recipe:
                        meal["recipe_title"] = recipe.get("title", "Unknown Recipe")
                    else:
                        meal["recipe_title"] = "Recipe Not Found"
                except:
                    meal["recipe_title"] = "Unknown Recipe"
                
                # Add warnings
                meal["warnings"] = await check_inventory(
                    meal.get("recipe_id", ""),
                    meal.get("servings", 1)
                )
                
                enriched_meals.append(meal)
            except Exception as e:
                print(f"Error enriching meal {meal.get('_id')}: {str(e)}")
                continue
        
        return enriched_meals
    except Exception as e:
        print(f"Error fetching meals: {str(e)}")
        return []

# ✅ UPDATE
@router.put("/{meal_id}", response_model=MealScheduleResponse)
async def update_meal(meal_id: str, schedule: MealScheduleUpdate):
    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meal ID")

    existing = await meal_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Meal not found")

    update_fields = schedule.model_dump(exclude_unset=True)

    # Handle enum conversions
    if "meal_date" in update_fields and update_fields["meal_date"]:
        update_fields["meal_date"] = update_fields["meal_date"].isoformat()
    if "meal_type" in update_fields and update_fields["meal_type"]:
        update_fields["meal_type"] = update_fields["meal_type"].value
    if "status" in update_fields and update_fields["status"]:
        update_fields["status"] = update_fields["status"].value
        # Set completed_at when status changes to done
        if update_fields["status"] == "done":
            update_fields["completed_at"] = datetime.now(timezone.utc)

    # Prevent changing to a date+meal_type combination that already exists
    if "meal_date" in update_fields or "meal_type" in update_fields:
        new_date = update_fields.get("meal_date", existing["meal_date"])
        new_type = update_fields.get("meal_type", existing["meal_type"])

        clash = await meal_collection.find_one({
            "user_id": existing["user_id"],
            "meal_date": new_date,
            "meal_type": new_type,
            "_id": {"$ne": obj_id},
        })
        if clash:
            raise HTTPException(
                status_code=400,
                detail="Another meal already exists for this date and meal type.",
            )

    update_fields["updated_at"] = datetime.now(timezone.utc)

    result = await meal_collection.update_one({"_id": obj_id}, {"$set": update_fields})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")

    updated = await meal_collection.find_one({"_id": obj_id})
    return await get_meal_with_recipe_details(updated)

# ✅ DELETE
@router.delete("/{meal_id}")
async def delete_meal(meal_id: str):
    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meal ID")

    result = await meal_collection.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")

    return {"message": "Meal deleted successfully"}