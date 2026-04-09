import re
from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id
from ..schemas.meal_schedule_schema import (
    MealScheduleCreate, MealScheduleUpdate, MealScheduleResponse,
    MealStatus, MealType
)
from ..utils.unit_converter import calc_missing, same_group, _norm, ALL_FACTORS
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
            recipe_unit = ing.get("unit", "")
            inventory = await db.inventory_items.find_one({
                "name": {"$regex": f"^{re.escape(ing_name)}$", "$options": "i"},
                "userId": user_id
            })
            inv_qty  = float(inventory["quantity"]) if inventory else 0.0
            inv_unit = inventory.get("unit", recipe_unit) if inventory else recipe_unit
            missing_qty, _ = calc_missing(
                ing.get("quantity", 1), recipe_unit,
                inv_qty, inv_unit,
                servings
            )
            if missing_qty > 0:
                required = round(ing.get("quantity", 1) * servings, 4)
                warnings.append(
                    f"Need {missing_qty} {recipe_unit} more {ing_name} "
                    f"(have {inv_qty} {inv_unit}, need {required} {recipe_unit})"
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
                    {"name": {"$regex": f"^{re.escape(ing['name'])}$", "$options": "i"}}
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

    meal_doc["warnings"] = meal_doc.get("warnings_snapshot", [])
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
        "$or": [{"user_id": user_id}, {"user_id": "1"}],
        "meal_date": schedule.meal_date.isoformat(),
        "meal_type": schedule.meal_type.value,
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a meal planned for this date and meal type.")

    now      = datetime.now(timezone.utc)
    servings = schedule.servings or 1

    pre_warnings = await check_inventory(db, schedule.recipe_id, user_id, servings)

    ingredients_snapshot = []
    for ing in recipe.get("ingredients", []):
        recipe_unit = _norm(ing.get("unit", ""))
        required    = ing.get("quantity", 1) * servings
        inv_item = await db.inventory_items.find_one({
            "name": {"$regex": f"^{re.escape(ing['name'])}$", "$options": "i"},
            "userId": user_id
        })
        inv_qty  = float(inv_item["quantity"]) if inv_item else 0.0
        inv_unit = _norm(inv_item.get("unit", recipe_unit)) if inv_item else recipe_unit
        missing_qty, _ = calc_missing(
            ing.get("quantity", 1), recipe_unit,
            inv_qty, inv_unit,
            servings
        )
        ingredients_snapshot.append({
            "name":               ing["name"],
            "quantity":           required,
            "unit":               ing.get("unit", ""),
            "missing":            missing_qty > 0,
            "missing_quantity":   missing_qty,
            "inventory_quantity": inv_qty,
            "inventory_unit":     inv_unit,
        })

    meal_dict = schedule.model_dump()
    meal_dict["user_id"]                = user_id
    meal_dict["meal_date"]              = schedule.meal_date.isoformat()
    meal_dict["meal_type"]              = schedule.meal_type.value
    meal_dict["status"]                 = schedule.status.value
    meal_dict["created_at"]             = now
    meal_dict["updated_at"]             = now
    meal_dict["warnings_snapshot"]      = pre_warnings
    meal_dict["ingredients_snapshot"]   = ingredients_snapshot

    result  = await db.meal_schedules.insert_one(meal_dict)
    meal_id = str(result.inserted_id)

    for ing in recipe.get("ingredients", []):
        recipe_unit = _norm(ing.get("unit", ""))
        required    = ing.get("quantity", 1) * servings

        inv_item = await db.inventory_items.find_one({
            "name": {"$regex": f"^{re.escape(ing['name'])}$", "$options": "i"},
            "userId": user_id
        })

        inv_qty  = float(inv_item["quantity"]) if inv_item else 0.0
        inv_unit = _norm(inv_item.get("unit", recipe_unit)) if inv_item else recipe_unit

        if same_group(recipe_unit, inv_unit):
            r_factor  = ALL_FACTORS.get(recipe_unit, 1.0)
            i_factor  = ALL_FACTORS.get(inv_unit, 1.0)
            req_base  = required  * r_factor
            inv_base  = inv_qty   * i_factor
            used_base = min(req_base, inv_base)
            miss_base = max(req_base - inv_base, 0.0)
            new_qty   = round(max(inv_base - used_base, 0.0) / i_factor, 4)
            miss_qty  = round(miss_base / r_factor, 4)
        else:
            used_qty = min(required, inv_qty)
            new_qty  = round(max(inv_qty - used_qty, 0.0), 4)
            miss_qty = round(max(required - inv_qty, 0.0), 4)

        if inv_item and inv_qty > 0:
            await db.inventory_items.update_one(
                {"_id": inv_item["_id"]},
                {"$set": {"quantity": new_qty, "updatedAt": now}}
            )

    created_meal = await db.meal_schedules.find_one({"_id": result.inserted_id})
    return await get_meal_with_recipe_details(db, created_meal, user_id)


@router.get("/")
async def get_meals(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    try:
        query = {"user_id": user_id} if user_id == "1" else {"$or": [{"user_id": user_id}, {"user_id": "1"}]}
        cursor = db.meal_schedules.find(query)
        meals  = await cursor.to_list(length=None)
        enriched = []
        for meal in meals:
            try:
                meal["_id"] = str(meal["_id"])
                try:
                    recipe = await db.recipes.find_one({"_id": ObjectId(meal.get("recipe_id"))})
                    meal["recipe_title"] = recipe.get("title", "Unknown Recipe") if recipe else "Recipe Not Found"
                except Exception:
                    meal["recipe_title"] = "Unknown Recipe"
                meal["warnings"] = meal.get("warnings_snapshot", [])
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

    user_query = {"_id": obj_id, "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    existing = await db.meal_schedules.find_one(user_query)
    if not existing:
        raise HTTPException(status_code=404, detail="Meal not found or unauthorized")

    update_fields = schedule.model_dump(exclude_unset=True)

    if "meal_date" in update_fields and update_fields["meal_date"]:
        update_fields["meal_date"] = update_fields["meal_date"].isoformat()
    if "meal_type" in update_fields and update_fields["meal_type"]:
        update_fields["meal_type"] = update_fields["meal_type"].value
    if "status" in update_fields and update_fields["status"]:
        update_fields["status"] = update_fields["status"].value
        if update_fields["status"] == "completed":
            update_fields["completed_at"] = datetime.now(timezone.utc)

    if "meal_date" in update_fields or "meal_type" in update_fields:
        new_date = update_fields.get("meal_date", existing["meal_date"])
        new_type = update_fields.get("meal_type", existing["meal_type"])
        clash = await db.meal_schedules.find_one({
            "$or": [{"user_id": user_id}, {"user_id": "1"}],
            "meal_date": new_date,
            "meal_type": new_type,
            "_id": {"$ne": obj_id},
        })
        if clash:
            raise HTTPException(status_code=400, detail="Another meal already exists for this date and meal type.")

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db.meal_schedules.update_one(
        {"_id": obj_id, "$or": [{"user_id": user_id}, {"user_id": "1"}]},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found or unauthorized")

    # If meal is marked completed, update ingredients_snapshot to clear missing flags
    if update_fields.get("status") == "completed":
        snapshot = existing.get("ingredients_snapshot", [])
        if snapshot:
            updated_snapshot = [
                {**ing, "missing": False, "missing_quantity": 0.0}
                for ing in snapshot
            ]
            await db.meal_schedules.update_one(
                {"_id": obj_id},
                {"$set": {"ingredients_snapshot": updated_snapshot}}
            )

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

    result = await db.meal_schedules.delete_one(
        {"_id": obj_id, "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found or unauthorized")

    return {"message": "Meal deleted successfully"}


@router.get("/{meal_id}/ingredients")
async def get_meal_ingredients(meal_id: str):
    """Return per-ingredient snapshot stored at meal creation time."""
    db = get_db()
    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meal ID")

    meal = await db.meal_schedules.find_one({"_id": obj_id})
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    snapshot = meal.get("ingredients_snapshot")

    if not snapshot:
        try:
            recipe = await db.recipes.find_one({"_id": ObjectId(meal["recipe_id"])})
        except Exception:
            raise HTTPException(status_code=404, detail="Recipe not found")
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        servings = meal.get("servings", 1)
        snapshot = []
        for ing in recipe.get("ingredients", []):
            recipe_unit = ing.get("unit", "")
            inventory   = await db.inventory_items.find_one({
                "name": {"$regex": f"^{re.escape(ing['name'])}$", "$options": "i"},
                "userId": meal.get("user_id", "1")
            })
            inv_qty  = float(inventory["quantity"]) if inventory else 0.0
            inv_unit = inventory.get("unit", recipe_unit) if inventory else recipe_unit
            missing_qty, _ = calc_missing(
                ing.get("quantity", 1), recipe_unit, inv_qty, inv_unit, servings
            )
            snapshot.append({
                "name":               ing["name"],
                "quantity":           ing.get("quantity", 1) * servings,
                "unit":               recipe_unit,
                "missing":            missing_qty > 0,
                "missing_quantity":   missing_qty,
                "inventory_quantity": inv_qty,
                "inventory_unit":     inv_unit,
            })
        recipe_title = recipe.get("title", "")
    else:
        try:
            recipe = await db.recipes.find_one({"_id": ObjectId(meal["recipe_id"])})
            recipe_title = recipe.get("title", "") if recipe else ""
        except Exception:
            recipe_title = ""

    return [
        {
            **ing,
            "recipe_id":    meal["recipe_id"],
            "meal_id":      str(meal["_id"]),
            "recipe_title": recipe_title,
        }
        for ing in snapshot
    ]


@router.patch("/{meal_id}/use-ingredients")
async def use_ingredients(meal_id: str):
    """Subtract recipe ingredient quantities from inventory when a meal is completed."""
    db = get_db()
    try:
        obj_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meal ID")

    meal = await db.meal_schedules.find_one({"_id": obj_id})
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    recipe = await db.recipes.find_one({"_id": ObjectId(meal["recipe_id"])})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    servings = meal.get("servings", 1)
    user_id  = meal.get("user_id", "1")
    results  = []

    for ing in recipe.get("ingredients", []):
        recipe_unit = _norm(ing.get("unit", ""))
        required    = ing.get("quantity", 1) * servings

        inv_item = await db.inventory_items.find_one({
            "name": {"$regex": f"^{re.escape(ing['name'])}$", "$options": "i"},
            "userId": user_id
        })
        if not inv_item:
            results.append({"name": ing["name"], "status": "not_in_inventory"})
            continue

        inv_unit = _norm(inv_item.get("unit", recipe_unit))
        inv_qty  = float(inv_item["quantity"])

        if same_group(recipe_unit, inv_unit):
            r_factor  = ALL_FACTORS.get(recipe_unit, 1.0)
            i_factor  = ALL_FACTORS.get(inv_unit, 1.0)
            used_base = required * r_factor
            inv_base  = inv_qty  * i_factor
            new_qty   = round(max(inv_base - used_base, 0.0) / i_factor, 4)
        else:
            new_qty = round(max(inv_qty - required, 0.0), 4)

        await db.inventory_items.update_one(
            {"_id": inv_item["_id"]},
            {"$set": {"quantity": new_qty, "updatedAt": datetime.now(timezone.utc)}}
        )
        results.append({"name": ing["name"], "status": "updated", "new_quantity": new_qty})

    return {"updated": results}
