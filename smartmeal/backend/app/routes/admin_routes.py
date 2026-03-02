from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from app.db.database import get_db
from app.models.user import UserInDB, UserResponse
from app.api.deps import require_admin
from pydantic import BaseModel

router = APIRouter()

# A) USERS
@router.get("/users")
async def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserInDB = Depends(require_admin)
):
    db = get_db()
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["role"] = role

    skip = (page - 1) * limit
    cursor = db["users"].find(query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    total = await db["users"].count_documents(query)

    for u in users:
        u["_id"] = str(u["_id"])
        if "password_hash" in u:
            del u["password_hash"]

    return {
        "items": users,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: UserInDB = Depends(require_admin)):
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user_dict = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_dict["_id"] = str(user_dict["_id"])
    return UserResponse(**user_dict)

@router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: dict, current_user: UserInDB = Depends(require_admin)):
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    update_doc = {"updatedAt": datetime.now(timezone.utc)}
    if "name" in update_data:
        update_doc["name"] = update_data["name"]
    if "role" in update_data:
        update_doc["role"] = update_data["role"]
    if "preferences" in update_data:
        update_doc["preferences"] = update_data["preferences"]
        
    result = await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    updated_user = await db["users"].find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])
    if "password_hash" in updated_user:
        del updated_user["password_hash"]
        
    return {"message": "updated", "user": updated_user}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: UserInDB = Depends(require_admin)):
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    result = await db["users"].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "deleted"}

# B) INVENTORY
@router.get("/inventory")
async def get_inventory(
    userEmail: Optional[str] = None,
    expiringBefore: Optional[datetime] = None,
    expiredOnly: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserInDB = Depends(require_admin)
):
    db = get_db()
    query = {}
    
    if userEmail:
        user = await db["users"].find_one({"email": userEmail})
        if user:
            query["userId"] = str(user["_id"])
        else:
            return {"items": [], "total": 0, "page": page, "limit": limit}
            
    now = datetime.now(timezone.utc)
    if expiredOnly:
        query["expiryDate"] = {"$lt": now}
    elif expiringBefore:
        # FastAPI parsers datetime strings. Be careful timezone matches if possible.
        query["expiryDate"] = {"$lt": expiringBefore}
        
    skip = (page - 1) * limit
    cursor = db["inventory_items"].find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db["inventory_items"].count_documents(query)
    
    user_ids = list(set([item["userId"] for item in items if "userId" in item]))
    user_id_obj = [ObjectId(uid) for uid in user_ids if ObjectId.is_valid(uid)]
    users = await db["users"].find({"_id": {"$in": user_id_obj}}).to_list(length=len(user_id_obj))
    user_map = {str(u["_id"]): u.get("email", "") for u in users}
    
    for item in items:
        item["_id"] = str(item["_id"])
        item["userEmail"] = user_map.get(item.get("userId"), "Unknown")
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: UserInDB = Depends(require_admin)):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    result = await db["inventory_items"].delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    return {"message": "deleted"}

# C) NOTIFICATIONS
class NotificationRequest(BaseModel):
    userId: str
    type: str = "ADMIN_MESSAGE"
    message: str

@router.post("/notifications")
async def send_notification(req: NotificationRequest, current_user: UserInDB = Depends(require_admin)):
    db = get_db()
    if not ObjectId.is_valid(req.userId):
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    new_notif = {
        "userId": req.userId,
        "type": req.type,
        "message": req.message,
        "read": False,
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db["notifications"].insert_one(new_notif)
    new_notif["_id"] = str(result.inserted_id)
    
    return {"message": "sent", "notification": new_notif}

# D) DASHBOARD METRICS
@router.get("/metrics")
async def get_metrics(current_user: UserInDB = Depends(require_admin)):
    db = get_db()
    
    totalUsers = await db["users"].count_documents({})
    totalInventoryItems = await db["inventory_items"].count_documents({})
    
    now = datetime.now(timezone.utc)
    in_three_days = now + timedelta(days=3)
    
    itemsExpiringSoon = await db["inventory_items"].count_documents({
        "expiryDate": {"$lte": in_three_days, "$gt": now}
    })
    
    expiredItems = await db["inventory_items"].count_documents({
        "expiryDate": {"$lt": now}
    })
    
    return {
        "totalUsers": totalUsers,
        "totalInventoryItems": totalInventoryItems,
        "itemsExpiringSoon": itemsExpiringSoon,
        "expiredItems": expiredItems
    }
