from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.leftover import LeftoverCreate, LeftoverUpdate, LeftoverResponse
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/leftovers", tags=["leftovers"])

def calculate_days_until_expiry(expiry_date: datetime) -> int:
    return (expiry_date - datetime.now()).days

def leftover_helper(leftover) -> dict:
    return {
        "id": str(leftover["_id"]),
        "name": leftover["name"],
        "quantity": leftover["quantity"],
        "category": leftover["category"],
        "cooked_date": leftover["cooked_date"],
        "expiry_date": leftover["expiry_date"],
        "storage_location": leftover["storage_location"],
        "notes": leftover.get("notes"),
        "image_url": leftover.get("image_url"),
        "is_used": leftover.get("is_used", False),
        "created_at": leftover["created_at"],
        "days_until_expiry": calculate_days_until_expiry(leftover["expiry_date"])
    }

@router.post("/", response_model=LeftoverResponse, status_code=201)
async def create_leftover(leftover: LeftoverCreate):
    db = await get_database()
    leftover_dict = leftover.model_dump()
    leftover_dict["created_at"] = datetime.now()
    leftover_dict["is_used"] = False
    
    result = await db.leftovers.insert_one(leftover_dict)
    new_leftover = await db.leftovers.find_one({"_id": result.inserted_id})
    return leftover_helper(new_leftover)

@router.get("/", response_model=List[LeftoverResponse])
async def get_all_leftovers(include_used: bool = Query(False)):
    db = await get_database()
    query = {} if include_used else {"is_used": False}
    leftovers = await db.leftovers.find(query).sort("expiry_date", 1).to_list(100)
    return [leftover_helper(leftover) for leftover in leftovers]

@router.get("/expiring-soon", response_model=List[LeftoverResponse])
async def get_expiring_soon(days: int = Query(3, ge=1)):
    db = await get_database()
    threshold_date = datetime.now() + timedelta(days=days)
    leftovers = await db.leftovers.find({
        "is_used": False,
        "expiry_date": {"$lte": threshold_date, "$gte": datetime.now()}
    }).sort("expiry_date", 1).to_list(100)
    return [leftover_helper(leftover) for leftover in leftovers]

@router.get("/{leftover_id}", response_model=LeftoverResponse)
async def get_leftover(leftover_id: str):
    db = await get_database()
    if not ObjectId.is_valid(leftover_id):
        raise HTTPException(status_code=400, detail="Invalid leftover ID")
    
    leftover = await db.leftovers.find_one({"_id": ObjectId(leftover_id)})
    if not leftover:
        raise HTTPException(status_code=404, detail="Leftover not found")
    return leftover_helper(leftover)

@router.put("/{leftover_id}", response_model=LeftoverResponse)
async def update_leftover(leftover_id: str, leftover_update: LeftoverUpdate):
    db = await get_database()
    if not ObjectId.is_valid(leftover_id):
        raise HTTPException(status_code=400, detail="Invalid leftover ID")
    
    existing = await db.leftovers.find_one({"_id": ObjectId(leftover_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Leftover not found")
    
    update_data = {k: v for k, v in leftover_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "expiry_date" in update_data and "cooked_date" not in update_data:
        if update_data["expiry_date"] <= existing["cooked_date"]:
            raise HTTPException(status_code=400, detail="Expiry date must be after cooked date")
    
    if "cooked_date" in update_data and "expiry_date" not in update_data:
        if existing["expiry_date"] <= update_data["cooked_date"]:
            raise HTTPException(status_code=400, detail="Expiry date must be after cooked date")
    
    result = await db.leftovers.update_one(
        {"_id": ObjectId(leftover_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leftover not found")
    
    updated_leftover = await db.leftovers.find_one({"_id": ObjectId(leftover_id)})
    return leftover_helper(updated_leftover)

@router.patch("/{leftover_id}/mark-used", response_model=LeftoverResponse)
async def mark_leftover_used(leftover_id: str):
    db = await get_database()
    if not ObjectId.is_valid(leftover_id):
        raise HTTPException(status_code=400, detail="Invalid leftover ID")
    
    result = await db.leftovers.update_one(
        {"_id": ObjectId(leftover_id)},
        {"$set": {"is_used": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leftover not found")
    
    updated_leftover = await db.leftovers.find_one({"_id": ObjectId(leftover_id)})
    return leftover_helper(updated_leftover)

@router.delete("/{leftover_id}", status_code=204)
async def delete_leftover(leftover_id: str):
    db = await get_database()
    if not ObjectId.is_valid(leftover_id):
        raise HTTPException(status_code=400, detail="Invalid leftover ID")
    
    result = await db.leftovers.delete_one({"_id": ObjectId(leftover_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leftover not found")
