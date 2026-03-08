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
