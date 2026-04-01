from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id
from ..utils.unit_converter import calc_missing, _norm

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
    query = {"user_id": user_id}
    if status_filter:
        query["status"] = status_filter
    print(f"🔍 Shopping API Query: {query}")
    cursor = db.shopping_items.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    print(f"📊 Found {len(items)} items")
    print(f"📝 Items: {items}")
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/shopping/stats")
async def get_stats(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    total = await db.shopping_items.count_documents({"user_id": user_id})
    bought = await db.shopping_items.count_documents({"user_id": user_id, "status": "bought"})
    pending = await db.shopping_items.count_documents({"user_id": user_id, "status": "pending"})
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
    print(f"➕ Adding shopping item: {doc}")
    result = await db.shopping_items.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    print(f"✅ Item inserted with ID: {result.inserted_id}")
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
    # Ensure item belongs to user
    result = await db.shopping_items.update_one(
        {"_id": ObjectId(item_id), "user_id": user_id},
        {"$set": update}
    )
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
    # Ensure item belongs to user AND mark as bought
    result = await db.shopping_items.update_one(
        {"_id": ObjectId(item_id), "user_id": user_id},
        {"$set": {"status": "bought", "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")

    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    if not doc:
         raise HTTPException(status_code=404, detail="Item not found")

    # Add quantity to inventory (upsert)
    name     = doc.get("name", "")
    quantity = float(doc.get("quantity") or 1)
    unit     = doc.get("unit", "")

    existing = await db.inventory_items.find_one(
        {"name": {"$regex": f"^{name}$", "$options": "i"}, "userId": user_id}
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
            "notes":     f"Added from shopping list",
            "createdAt": now,
            "updatedAt": now,
        })

    doc["_id"] = str(doc["_id"])
    doc["status"] = "bought"

    # ── Refresh ALL planned meal snapshots against live inventory ────────────
    meals_cursor = db.meal_schedules.find({
        "user_id": user_id,
        "status": {"$nin": ["completed", "skipped"]},
    })
    meals = await meals_cursor.to_list(length=None)

    for meal in meals:
        snapshot = meal.get("ingredients_snapshot", [])
        if not snapshot:
            continue

        servings     = max(meal.get("servings", 1), 1)
        new_snapshot = []
        changed      = False

        for ing in snapshot:
            # Fetch current live inventory for this ingredient
            inv_item = await db.inventory_items.find_one({
                "name":   {"$regex": f"^{ing['name']}$", "$options": "i"},
                "userId": user_id,
            })
            inv_qty     = float(inv_item["quantity"]) if inv_item else 0.0
            inv_unit    = _norm(inv_item.get("unit", ing.get("unit", ""))) if inv_item else _norm(ing.get("unit", ""))
            recipe_unit = _norm(ing.get("unit", ""))

            # The meal already deducted available stock at creation time.
            # Only the missing_quantity still needs to be sourced.
            # So check: does current inventory cover the missing_quantity?
            still_missing_qty = ing.get("missing_quantity", 0)
            if still_missing_qty > 0:
                missing_qty, _ = calc_missing(
                    still_missing_qty, recipe_unit,
                    inv_qty, inv_unit,
                    1  # missing_quantity is already the absolute amount needed
                )
            else:
                missing_qty = 0.0

            was_missing = bool(ing.get("missing"))
            now_missing = missing_qty > 0

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
    result = await db.shopping_items.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    return {"message": "deleted"}


@router.delete("/shopping/clear-bought")
async def clear_bought(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = await db.shopping_items.delete_many({"user_id": user_id, "status": "bought"})
    return {"deleted": result.deleted_count}