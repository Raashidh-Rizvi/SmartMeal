<<<<<<< HEAD
"""
Shopping Routes
Thin HTTP layer — delegates all business logic to shopping_service.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from bson import ObjectId

from app.models.shopping_model import (
    ShoppingItem,
    ShoppingItemCreate,
    ShoppingItemUpdate,
)
from app.services.shopping_service import (
    get_all_items,
    get_pending_items,
    get_bought_items,
    add_item,
    update_item,
    mark_item_bought,
    delete_item,
    get_stats,
    add_items_from_meal_plan,
    clear_bought_items,
)

router = APIRouter(prefix="/shopping", tags=["Shopping List"])


# ── Read ─────────────────────────────────────────────────────────────────────

@router.get("/all", response_model=List[ShoppingItem])
async def route_get_all_items(
    user_id: str = Query(..., description="User ID to filter shopping items"),
    status_filter: Optional[str] = Query(None, description="Filter by status: Pending or Bought"),
):
    """Get all shopping items for a user (optional status filter)."""
    return await get_all_items(user_id, status_filter)


@router.get("/pending", response_model=List[ShoppingItem])
async def route_get_pending_items(user_id: str = Query(...)):
    """Get all pending items for a user."""
    return await get_pending_items(user_id)


@router.get("/bought", response_model=List[ShoppingItem])
async def route_get_bought_items(user_id: str = Query(...)):
    """Get all bought items for a user."""
    return await get_bought_items(user_id)


@router.get("/stats")
async def route_get_stats(user_id: str = Query(...)):
    """Get shopping statistics for charts."""
    return await get_stats(user_id)


# ── Create ───────────────────────────────────────────────────────────────────

@router.post("/add", response_model=ShoppingItem)
async def route_add_item(item: ShoppingItemCreate):
    """
    Add a new shopping item.
    Prevents duplicates — merges quantity if a pending item with the same
    name already exists for the user.
    """
    return await add_item(item)


@router.post("/add-from-meal-plan")
async def route_add_from_meal_plan(user_id: str, items: List[ShoppingItemCreate]):
    """Add multiple items from a meal plan (batch add)."""
    return await add_items_from_meal_plan(user_id, items)


# ── Update ───────────────────────────────────────────────────────────────────

@router.put("/update/{item_id}", response_model=ShoppingItem)
async def route_update_item(item_id: str, update_data: ShoppingItemUpdate):
    """Update a shopping item (quantity, status, etc.)."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    result = await update_item(item_id, update_data)

    if result is None:
        # update_item returns None for both "no fields" and "not found"
        # Distinguish by checking if the update_dict would be empty
        try:
            has_fields = any(v is not None for v in update_data.model_dump().values())
        except AttributeError:
            has_fields = any(v is not None for v in update_data.dict().values())

        if not has_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        raise HTTPException(status_code=404, detail="Item not found")

    return result


@router.patch("/mark-bought/{item_id}", response_model=ShoppingItem)
async def route_mark_bought(item_id: str):
    """Mark an item as bought."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    result = await mark_item_bought(item_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return result


# ── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/delete/{item_id}")
async def route_delete_item(item_id: str):
    """Delete a shopping item."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    deleted = await delete_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully", "item_id": item_id}


@router.delete("/clear-bought")
async def route_clear_bought(user_id: str = Query(...)):
    """Clear all bought items for a user."""
    return await clear_bought_items(user_id)
=======
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
    source: Optional[str] = "manual"
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
    source: Optional[str] = None


@router.get("/shopping/all")
async def get_items(user_id: str, status_filter: Optional[str] = None, source_filter: Optional[str] = None):
    db = get_db()
    # Fix: Use a consistent base query that always includes user_id
    query = {"$or": [{"user_id": user_id}, {"user_id": "1"}]} if user_id != "1" else {"user_id": "1"}
    
    if status_filter:
        query["status"] = {"$regex": f"^{status_filter}$", "$options": "i"}
    
    if source_filter:
        # Normalize: meal-plan (frontend) -> match both "meal_plan" and "meal plan"
        if source_filter == "meal-plan":
            source_query = {
                "$or": [
                    {"source": {"$regex": "meal_plan", "$options": "i"}},
                    {"source": {"$regex": "meal plan", "$options": "i"}},
                    {"source": {"$regex": "meal-plan", "$options": "i"}},
                    {"sources": {"$in": ["meal_plan", "meal plan", "meal-plan"]}}
                ]
            }
        else:
            normalized = source_filter
            source_query = {
                "$or": [
                    {"source": {"$regex": normalized, "$options": "i"}},
                    {"sources": normalized}
                ]
            }
        # Combine with base query using $and
        query = {"$and": [query, source_query]}

    print(f"DEBUG: Shopping API Query: {query}")
    cursor = db.shopping_items.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    
    for item in items:
        item["_id"] = str(item["_id"])

    # If no source filter, aggregate common items for "All Sources" view
    if not source_filter and items:
        aggregated = {}
        for item in items:
            # Group by lower_name, unit, and status to sum quantities
            name_key = item.get("lower_name") or (item.get("name") or "").lower().strip()
            unit_key = (item.get("unit") or "").lower().strip()
            status_key = (item.get("status") or "pending").lower().strip()
            
            key = (name_key, unit_key, status_key)
            
            if key not in aggregated:
                # Store a copy to avoid mutating the original
                agg_item = dict(item)
                agg_item["ids"] = [str(item["_id"])]
                src = item.get("source", "manual").lower()
                agg_item["display_sources"] = {src}
                # Fix: Some items might have a 'sources' array already
                if "sources" in item and isinstance(item["sources"], list):
                    for s in item["sources"]:
                        agg_item["display_sources"].add(s.lower())
                aggregated[key] = agg_item
            else:
                aggregated[key]["quantity"] += item.get("quantity", 0)
                aggregated[key]["ids"].append(str(item["_id"]))
                src = item.get("source", "manual").lower()
                aggregated[key]["display_sources"].add(src)
                if "sources" in item and isinstance(item["sources"], list):
                    for s in item["sources"]:
                        aggregated[key]["display_sources"].add(s.lower())
        
        result = []
        for agg in aggregated.values():
            # Format source string: "meal plan / manual"
            sources = sorted(list(agg["display_sources"]))
            formatted_sources = []
            for s in sources:
                if "meal" in s and "plan" in s:
                    formatted_sources.append("meal plan")
                else:
                    formatted_sources.append(s)
            
            agg["source"] = " / ".join(formatted_sources) if formatted_sources else "manual"
            # Join IDs for actions
            agg["_id"] = ",".join(agg["ids"])
            result.append(agg)
        
        # Sort aggregated result by created_at descending (taking most recent)
        result.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        return result
        
    return items


@router.get("/shopping/stats")
async def get_stats(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    total = await db.shopping_items.count_documents({"user_id": user_id})
    bought = await db.shopping_items.count_documents({"user_id": user_id, "status": {"$regex": "^bought$", "$options": "i"}})
    pending = await db.shopping_items.count_documents({"user_id": user_id, "status": {"$regex": "^pending$", "$options": "i"}})
    
    # Check both source field and sources array for accurate counts
    manual_query = {
        "user_id": user_id, 
        "status": {"$regex": "^pending$", "$options": "i"},
        "$or": [
            {"source": {"$regex": "manual", "$options": "i"}},
            {"sources": {"$in": ["manual", "Manual"]}}
        ]
    }
    meal_plan_query = {
        "user_id": user_id, 
        "status": {"$regex": "^pending$", "$options": "i"},
        "$or": [
            {"source": {"$regex": "meal_plan", "$options": "i"}},
            {"source": {"$regex": "meal plan", "$options": "i"}},
            {"source": {"$regex": "meal-plan", "$options": "i"}},
            {"sources": {"$in": ["meal_plan", "meal plan", "meal-plan"]}}
        ]
    }
    manual = await db.shopping_items.count_documents(manual_query)
    meal_plan = await db.shopping_items.count_documents(meal_plan_query)
    
    return {
        "total": total, 
        "bought": bought, 
        "pending": pending,
        "source_breakdown": {"manual": manual, "meal_plan": meal_plan}
    }


@router.post("/shopping/add")
async def add_item(
    item: ShoppingItemCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = item.model_dump()
    doc["user_id"] = user_id  # Add user_id to doc
    doc["lower_name"] = doc["name"].lower().strip()
    doc["source"] = doc.get("source", "manual").lower()
    
    # Check for duplicate by name AND source AND status
    # This keeps manual and meal plan items separate for filtering
    existing = await db.shopping_items.find_one({
        "user_id": doc["user_id"],
        "lower_name": doc["lower_name"],
        "source": doc["source"],
        "status": "pending"
    })
    
    if existing:
        # Merge - update quantity
        new_qty = existing["quantity"] + doc["quantity"]
        
        result = await db.shopping_items.update_one(
            {"_id": ObjectId(existing["_id"])},
            {"$set": {
                "quantity": new_qty,
                "updated_at": now
            }}
        )
        existing["quantity"] = new_qty
        existing["updated_at"] = now.isoformat()
        existing["_id"] = str(existing["_id"])
        print(f"INFO: Merged duplicate item (same source), new qty: {new_qty}")
        return existing
    
    # New item
    doc["created_at"] = now
    doc["updated_at"] = now
    print(f"INFO: Adding new shopping item: {doc}")
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
    
    ids = item_id.split(",")
    object_ids = []
    for i in ids:
        try: object_ids.append(ObjectId(i))
        except: pass

    if not object_ids:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    # If updating an aggregated item, we update the first one and potentially handle others
    # For simplicity, we update ALL of them with the same values except quantity
    # If quantity is provided, we only update it for the first one and maybe reset others if they were merged?
    # Actually, the user likely wants to update the whole thing.
    
    result = await db.shopping_items.update_many(
        {"_id": {"$in": object_ids}, "$or": [{"user_id": user_id}, {"user_id": "1"}]},
        {"$set": update}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    
    doc = await db.shopping_items.find_one({"_id": object_ids[0]})
    doc["_id"] = str(doc["_id"])
    return doc


@router.patch("/shopping/mark-bought/{item_id}")
async def mark_bought(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    
    ids = item_id.split(",")
    object_ids = []
    for i in ids:
        try: object_ids.append(ObjectId(i))
        except: pass
        
    if not object_ids:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    user_filter = {"_id": {"$in": object_ids}, "$or": [{"user_id": user_id}, {"user_id": "1"}]}
    
    # Capture all items before marking as bought to update inventory correctly
    cursor = db.shopping_items.find(user_filter)
    items_to_add = await cursor.to_list(length=None)
    
    if not items_to_add:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")

    result = await db.shopping_items.update_many(
        user_filter,
        {"$set": {"status": "bought", "updated_at": now}}
    )
    
    # For inventory update, we process EACH item
    for doc in items_to_add:
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

    # Return the first one as a sample
    sample_doc = items_to_add[0]
    sample_doc["_id"] = str(sample_doc["_id"])
    sample_doc["status"] = "bought"
    
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

    return sample_doc


@router.delete("/shopping/delete/{item_id}")
async def delete_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    ids = item_id.split(",")
    object_ids = []
    for i in ids:
        try: object_ids.append(ObjectId(i))
        except: pass
        
    if not object_ids:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    result = await db.shopping_items.delete_many(
        {"_id": {"$in": object_ids}, "$or": [{"user_id": user_id}, {"user_id": "1"}]}
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
