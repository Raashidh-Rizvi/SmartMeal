from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from collections import defaultdict
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id
from ..utils.unit_converter import calc_missing, _norm, same_group, ALL_FACTORS

router = APIRouter()


class ShoppingItemCreate(BaseModel):
    name: str
    quantity: Optional[float] = 1
    unit: Optional[str] = ""
    category: Optional[str] = ""
    notes: Optional[str] = ""
    status: Optional[str] = "pending"
    meal_id: Optional[str] = ""


class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@router.get("/shopping/all")
async def get_items(
    user_id: str = Depends(get_current_user_id),
    status_filter: Optional[str] = None
):
    db = get_db()
    user_q = {"$or": [{"user_id": user_id}, {"user_id": "1"}]} if user_id != "1" else {"user_id": "1"}
    if status_filter:
        query = {**user_q, "status": status_filter}
    else:
        query = user_q
    cursor = db.shopping_items.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/shopping/stats")
async def get_stats(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    user_q = {"$or": [{"user_id": user_id}, {"user_id": "1"}]} if user_id != "1" else {"user_id": "1"}
    total   = await db.shopping_items.count_documents(user_q)
    bought  = await db.shopping_items.count_documents({**user_q, "status": "bought"})
    pending = await db.shopping_items.count_documents({**user_q, "status": "pending"})
    return {"total": total, "bought": bought, "pending": pending}


@router.post("/shopping/add")
async def add_item(
    item: ShoppingItemCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = item.model_dump()
    doc["user_id"] = user_id
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.shopping_items.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/shopping/update/{item_id}")
async def update_item(
    item_id: str,
    item: ShoppingItemUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    update = item.model_dump(exclude_unset=True)
    update["updated_at"] = datetime.now(timezone.utc)
    user_filter = {"_id": ObjectId(item_id), "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    result = await db.shopping_items.update_one(user_filter, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.patch("/shopping/mark-bought/{item_id}")
async def mark_bought(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    user_filter = {"_id": ObjectId(item_id), "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    result = await db.shopping_items.update_one(
        user_filter,
        {"$set": {"status": "bought", "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")

    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")

    name     = doc.get("name", "")
    quantity = float(doc.get("quantity") or 1)
    unit     = doc.get("unit", "")

    existing = await db.inventory_items.find_one(
        {"name": {"$regex": f"^{name}$", "$options": "i"},
         "$or": [{"userId": user_id}, {"userId": "1"}]}
    )
    if existing:
        new_qty = round(float(existing.get("quantity", 0)) + quantity, 4)
        await db.inventory_items.update_one(
            {"_id": existing["_id"]},
            {"$set": {"quantity": new_qty, "updatedAt": now}}
        )
    else:
        await db.inventory_items.insert_one({
            "name":      name,
            "quantity":  quantity,
            "unit":      unit,
            "userId":    user_id,
            "category":  doc.get("category", ""),
            "notes":     "Added from shopping list",
            "createdAt": now,
            "updatedAt": now,
        })

    doc["_id"] = str(doc["_id"])
    doc["status"] = "bought"

    # Refresh meal snapshots: only re-evaluate meals with missing ingredients
    meals_cursor = db.meal_schedules.find({
        "$or": [{"user_id": user_id}, {"user_id": "1"}],
        "status": {"$nin": ["completed", "skipped"]},
    })
    meals = await meals_cursor.to_list(length=None)
    meals.sort(key=lambda m: m.get("meal_date", ""))

    available = defaultdict(float)
    available_unit = {}
    inv_cursor = db.inventory_items.find({"$or": [{"userId": user_id}, {"userId": "1"}]})
    inv_items = await inv_cursor.to_list(length=None)
    for inv in inv_items:
        key = inv["name"].strip().lower()
        available[key] = float(inv.get("quantity", 0))
        available_unit[key] = _norm(inv.get("unit", ""))

    for meal in meals:
        snapshot = meal.get("ingredients_snapshot", [])
        if not snapshot:
            continue

        new_snapshot = []
        changed = False

        for ing in snapshot:
            was_missing = bool(ing.get("missing"))

            if not was_missing:
                new_snapshot.append(ing)
                continue

            ing_key     = ing["name"].strip().lower()
            recipe_unit = _norm(ing.get("unit", ""))
            needed      = float(ing.get("missing_quantity", ing.get("quantity", 0)))

            inv_qty  = available.get(ing_key, 0.0)
            inv_unit = available_unit.get(ing_key, recipe_unit)

            missing_qty, _ = calc_missing(needed, recipe_unit, inv_qty, inv_unit, 1)
            now_missing = missing_qty > 0

            if same_group(recipe_unit, inv_unit):
                r_factor  = ALL_FACTORS.get(recipe_unit, 1.0)
                i_factor  = ALL_FACTORS.get(inv_unit, 1.0)
                req_base  = needed * r_factor
                inv_base  = inv_qty * i_factor
                used_base = min(req_base, inv_base)
                available[ing_key] = max(inv_base - used_base, 0.0) / i_factor
            else:
                available[ing_key] = max(inv_qty - needed, 0.0)

            if was_missing != now_missing:
                changed = True

            new_snapshot.append({
                **ing,
                "missing":            now_missing,
                "missing_quantity":   round(missing_qty, 4),
                "inventory_quantity": inv_qty,
                "inventory_unit":     inv_unit,
            })

        if changed:
            new_warnings = [
                f"Need {i['missing_quantity']} {i['unit']} more {i['name']} "
                f"(have {i['inventory_quantity']} {i['inventory_unit']}, need {i['quantity']} {i['unit']})"
                for i in new_snapshot if i.get("missing")
            ]
            await db.meal_schedules.update_one(
                {"_id": meal["_id"]},
                {"$set": {
                    "ingredients_snapshot": new_snapshot,
                    "warnings_snapshot":    new_warnings,
                    "updated_at":           now,
                }}
            )

    return doc


@router.delete("/shopping/delete/{item_id}")
async def delete_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    result = await db.shopping_items.delete_one(
        {"_id": ObjectId(item_id), "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    return {"message": "deleted"}


@router.delete("/shopping/clear-bought")
async def clear_bought(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    query = {"status": "bought", "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    result = await db.shopping_items.delete_many(query)
    return {"deleted": result.deleted_count}
