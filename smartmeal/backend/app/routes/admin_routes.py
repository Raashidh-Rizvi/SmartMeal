<<<<<<< HEAD
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
=======
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone, timedelta
from ..db.database import get_db

router = APIRouter()


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    role: Optional[str] = None
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
):
    db = get_db()
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
<<<<<<< HEAD
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
=======
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if role:
        query["role"] = role
    skip = (page - 1) * limit
    cursor = db.users.find(query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    total = await db.users.count_documents(query)
    for u in users:
        u["_id"] = str(u["_id"])
        u.pop("password_hash", None)
        u["createdAt"] = u.get("createdAt", u.get("created_at"))
        u["is_active"] = u.get("is_active", True)
    return {"items": users, "total": total, "page": page, "limit": limit}

@router.get("/users/{user_id}")
async def get_user(user_id: str):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    db = get_db()
    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    user["createdAt"] = user.get("createdAt", user.get("created_at"))
    user["is_active"] = user.get("is_active", True)
    return user


@router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    db = get_db()
    data.pop("_id", None)
    data.pop("password_hash", None)
    if "is_active" in data:
        data["is_active"] = bool(data["is_active"])
    
    # ensure atomic update doesn't crash if data is empty
    if data:
        await db.users.update_one({"_id": obj_id}, {"$set": data})
    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("hashed_password", None)
    user["createdAt"] = user.get("createdAt", user.get("created_at"))
    user["is_active"] = user.get("is_active", True)
    return user


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    db = get_db()
    result = await db.users.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.get("/metrics")
async def get_metrics():
    db = get_db()
    return {
        "totalUsers": await db.users.count_documents({}),
        "totalRecipes": await db.recipes.count_documents({}),
        "totalMeals": await db.meal_schedules.count_documents({}),
        "total_users": await db.users.count_documents({}),
        "total_recipes": await db.recipes.count_documents({}),
        "total_meals": await db.meal_schedules.count_documents({}),
    }


@router.get("/analytics")
async def get_analytics():
    db = get_db()
    
    # 1. Meal Type Distribution
    pipeline_type = [
        {"$group": {"_id": "$meal_type", "count": {"$sum": 1}}}
    ]
    type_cursor = db.meal_schedules.aggregate(pipeline_type)
    meal_types = await type_cursor.to_list(length=None)
    
    # 2. Most Scheduled (Favorite) Recipes
    pipeline_favs = [
        {"$group": {"_id": "$recipe_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    fav_cursor = db.meal_schedules.aggregate(pipeline_favs)
    fav_raw = await fav_cursor.to_list(length=None)
    
    most_favorited = []
    for item in fav_raw:
        recipe = await db.recipes.find_one({"_id": ObjectId(item["_id"])})
        most_favorited.append({
            "name": recipe.get("title") if recipe else "Unknown",
            "count": item["count"]
        })

    # 3. Highly Rated (Most Recommended) Recipes
    pipeline_rated = [
        {"$match": {"rating": {"$exists": True, "$ne": None}}},
        {"$group": {
            "_id": "$recipe_id", 
            "avgRating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"avgRating": -1, "count": -1}},
        {"$limit": 5}
    ]
    rated_cursor = db.meal_schedules.aggregate(pipeline_rated)
    rated_raw = await rated_cursor.to_list(length=None)
    
    highly_rated = []
    for item in rated_raw:
        recipe = await db.recipes.find_one({"_id": ObjectId(item["_id"])})
        highly_rated.append({
            "name": recipe.get("title") if recipe else "Unknown",
            "rating": round(item["avgRating"], 1),
            "count": item["count"]
        })

    # 4. Usage Trends (Last 7 days)
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    # Note: simple string comparison if meal_date is ISO string or date objects
    # We aggregate count per day
    pipeline_trends = [
        {"$match": {"created_at": {"$gte": week_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    trend_cursor = db.meal_schedules.aggregate(pipeline_trends)
    trends = await trend_cursor.to_list(length=None)

    # 5. Category Distribution
    cat_cursor = db.meal_schedules.aggregate([
        {"$lookup": {
            "from": "recipes",
            "localField": "recipe_id",
            "foreignField": "_id",
            "as": "recipe_details"
        }},
        {"$unwind": "$recipe_details"},
        {"$group": {"_id": "$recipe_details.category", "count": {"$sum": 1}}}
    ])
    categories = await cat_cursor.to_list(length=None)

    return {
        "mealTypes": {item["_id"]: item["count"] for item in meal_types if item["_id"]},
        "mostFavorited": most_favorited,
        "highlyRated": highly_rated,
        "categories": {item["_id"]: item["count"] for item in categories if item["_id"]},
        "usageTrends": trends
    }


@router.get("/inventory")
async def admin_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    userEmail: Optional[str] = None,
    expiredOnly: Optional[bool] = False,
    expiringBefore: Optional[str] = None
):
    db = get_db()
    
    # Base match for inventory items
    match_query = {}
    
    if expiredOnly:
        match_query["expiryDate"] = {"$lt": datetime.now(timezone.utc)}
    
    if expiringBefore:
        try:
            # Try parsing ISO format first
            dt = datetime.fromisoformat(expiringBefore.replace('Z', '+00:00'))
            match_query["expiryDate"] = {"$lte": dt}
        except (ValueError, TypeError):
            pass

    # Aggregation pipeline
    pipeline = []
    
    # 1. Initial filter for inventory fields
    if match_query:
        pipeline.append({"$match": match_query})
    
    # 2. Join with users to get email
    pipeline.extend([
        {
            "$addFields": {
                "userObjId": {
                    "$convert": {
                        "input": "$userId",
                        "to": "objectId",
                        "onError": None,
                        "onNull": None
                    }
                }
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "userObjId",
                "foreignField": "_id",
                "as": "user_info"
            }
        },
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "userEmail": "$user_info.email"
            }
        }
    ])
    
    # 3. Filter by userEmail if provided
    if userEmail:
        pipeline.append({"$match": {"userEmail": {"$regex": userEmail, "$options": "i"}}})
    
    # 4. Facet for total count and paginated items
    pipeline.append({
        "$facet": {
            "metadata": [{"$count": "total"}],
            "data": [
                {"$sort": {"createdAt": -1}},
                {"$skip": (page - 1) * limit},
                {"$limit": limit}
            ]
        }
    })
    
    cursor = db.inventory_items.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    
    if not result:
        return {"items": [], "total": 0, "page": page, "limit": limit}
    
    facet_result = result[0]
    total = facet_result["metadata"][0]["total"] if facet_result["metadata"] else 0
    items = facet_result["data"]
    
    for item in items:
        item["_id"] = str(item["_id"])
        item.pop("userObjId", None)
        item.pop("user_info", None)
        if item.get("expiryDate"):
            item["expiryDate"] = item["expiryDate"].isoformat()
        if item.get("createdAt"):
            item["createdAt"] = item["createdAt"].isoformat()
        if item.get("updatedAt"):
            item["updatedAt"] = item["updatedAt"].isoformat()
            
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")
        
    result = await db.inventory_items.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    return {"message": "Inventory item deleted successfully"}


def serialize_notification(notification: dict) -> dict:
    notification["_id"] = str(notification["_id"])
    notification["createdAt"] = notification["createdAt"].isoformat() if notification.get("createdAt") else None
    return notification


@router.get("/notifications")
async def get_notifications(unread: Optional[bool] = Query(False)):
    db = get_db()
    query = {}
    if unread:
        query["isRead"] = False

    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifications = await cursor.to_list(length=None)
    return [serialize_notification(n) for n in notifications]


@router.get("/notifications/{notification_id}")
async def get_notification(notification_id: str):
    db = get_db()
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return serialize_notification(notification)


@router.post("/notifications")
async def create_notification(data: dict):
    db = get_db()
    user_id = data.get("userId")
    message = data.get("message")
    if not user_id or not message:
        raise HTTPException(status_code=400, detail="userId and message are required")

    notification = {
        "userId": user_id,
        "type": data.get("type", "ADMIN_MESSAGE"),
        "message": message,
        "isRead": False,
        "createdAt": datetime.now(timezone.utc),
    }
    if data.get("inventoryItemId"):
        notification["inventoryItemId"] = data["inventoryItemId"]

    result = await db.notifications.insert_one(notification)
    notification["_id"] = str(result.inserted_id)
    notification["createdAt"] = notification["createdAt"].isoformat()
    return notification


@router.post("/notifications/expiration-alerts")
async def create_expiration_alerts():
    db = get_db()
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=7)

    cursor = db.inventory_items.find({
        "expiryDate": {"$gte": now, "$lte": soon}
    })
    inventory_items = await cursor.to_list(length=None)

    created_notifications = []
    for item in inventory_items:
        if not item.get("userId"):
            continue
        inventory_item_id = str(item["_id"])
        existing = await db.notifications.find_one({
            "userId": item["userId"],
            "inventoryItemId": inventory_item_id,
            "type": "EXPIRING_FOOD",
        })
        if existing:
            continue

        expiry_date = item.get("expiryDate")
        expiry_text = expiry_date.strftime("%Y-%m-%d") if expiry_date else "soon"
        item_name = item.get("name") or item.get("title") or "inventory item"
        message = f"{item_name} is about to expire on {expiry_text}. Please use it before it spoils."

        notification = {
            "userId": item["userId"],
            "type": "EXPIRING_FOOD",
            "message": message,
            "inventoryItemId": inventory_item_id,
            "isRead": False,
            "createdAt": now,
        }
        result = await db.notifications.insert_one(notification)
        notification["_id"] = str(result.inserted_id)
        created_notifications.append(serialize_notification(notification))

    return {
        "created": len(created_notifications),
        "notifications": created_notifications,
    }


@router.put("/notifications/{notification_id}")
async def update_notification(notification_id: str, data: dict):
    db = get_db()
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    update_data = {}
    if "isRead" in data:
        update_data["isRead"] = bool(data["isRead"])
    if "message" in data:
        update_data["message"] = data["message"]

    if update_data:
        await db.notifications.update_one({"_id": ObjectId(notification_id)}, {"$set": update_data})

    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    return serialize_notification(notification)


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    db = get_db()
    result = await db.notifications.delete_one({"_id": ObjectId(notification_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
