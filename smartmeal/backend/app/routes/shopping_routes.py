from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db

router = APIRouter()


class ShoppingItemCreate(BaseModel):
    user_id: str
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
    query = {"user_id": user_id}
    if status_filter:
        query["status"] = {"$regex": f"^{status_filter}$", "$options": "i"}
    if source_filter:
        query["source"] = {"$regex": f"^{source_filter}", "$options": "i"}
    print(f"🔍 Shopping API Query: {query}")
    cursor = db.shopping_items.find(query).sort("created_at", -1)
    items = await cursor.to_list(length=None)
    print(f"📊 Found {len(items)} items")
    print(f"📝 Items: {items}")
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.get("/shopping/stats")
async def get_stats(user_id: str):
    db = get_db()
    total = await db.shopping_items.count_documents({"user_id": user_id})
    bought = await db.shopping_items.count_documents({"user_id": user_id, "status": {"$regex": "^bought$", "$options": "i"}})
    pending = await db.shopping_items.count_documents({"user_id": user_id, "status": {"$regex": "^pending$", "$options": "i"}})
    
    manual = await db.shopping_items.count_documents({
        "user_id": user_id, 
        "status": {"$regex": "^pending$", "$options": "i"},
        "$or": [{"source": "manual"}, {"source": "Manual"}, {"source": {"$regex": "^manual", "$options": "i"}}]
    })
    meal_plan = await db.shopping_items.count_documents({
        "user_id": user_id, 
        "status": {"$regex": "^pending$", "$options": "i"},
        "source": {"$not": {"$regex": "^manual", "$options": "i"}}
    })
    
    return {
        "total": total, 
        "bought": bought, 
        "pending": pending,
        "source_breakdown": {"manual": manual, "meal_plan": meal_plan}
    }


@router.post("/shopping/add")
async def add_item(item: ShoppingItemCreate):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = item.model_dump()
    doc["lower_name"] = doc["name"].lower().strip()
    doc["source"] = doc.get("source", "manual").lower()
    
    # Check for duplicate case-insensitive
    existing = await db.shopping_items.find_one({
        "user_id": doc["user_id"],
        "lower_name": doc["lower_name"],
        "status": "pending",
        "source": doc["source"]
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
        print(f"🔄 Merged duplicate item, new qty: {new_qty}")
        return existing
    
    # New item
    doc["created_at"] = now
    doc["updated_at"] = now
    print(f"➕ Adding new shopping item: {doc}")
    result = await db.shopping_items.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    print(f"✅ Item inserted with ID: {result.inserted_id}")
    return doc


@router.put("/shopping/update/{item_id}")
async def update_item(item_id: str, item: ShoppingItemUpdate):
    db = get_db()
    update = item.model_dump(exclude_unset=True)
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db.shopping_items.update_one({"_id": ObjectId(item_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.patch("/shopping/mark-bought/{item_id}")
async def mark_bought(item_id: str):
    db = get_db()
    result = await db.shopping_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"status": "bought", "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    doc = await db.shopping_items.find_one({"_id": ObjectId(item_id)})
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/shopping/delete/{item_id}")
async def delete_item(item_id: str):
    db = get_db()
    result = await db.shopping_items.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "deleted"}


@router.delete("/shopping/clear-bought")
async def clear_bought(user_id: str):
    db = get_db()
    result = await db.shopping_items.delete_many({"user_id": user_id, "status": "bought"})
    return {"deleted": result.deleted_count}