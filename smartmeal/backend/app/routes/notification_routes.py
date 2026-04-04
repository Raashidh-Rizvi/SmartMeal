from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id

router = APIRouter()


def serialize_notification(notification: dict) -> dict:
    if "_id" in notification:
        notification["_id"] = str(notification["_id"])
    if "createdAt" in notification and isinstance(notification["createdAt"], datetime):
        notification["createdAt"] = notification["createdAt"].isoformat()
    
    # For broadcast notifications, check if this specific user has read it
    if notification.get("userId") == "ALL" and user_id:
        notification["isRead"] = user_id in notification.get("readByUserIds", [])
        
    return notification


async def generate_expiring_food_alerts(db, user_id: str):
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=7)

    cursor = db.inventory_items.find({
        "userId": user_id,
        "expiryDate": {"$gte": now, "$lte": soon}
    })
    items = await cursor.to_list(length=None)

    for item in items:
        inventory_item_id = str(item["_id"])
        existing = await db.notifications.find_one({
            "userId": user_id,
            "inventoryItemId": inventory_item_id,
            "type": "EXPIRING_FOOD",
        })
        if existing:
            continue

        expiry_date = item.get("expiryDate")
        expiry_text = expiry_date.strftime("%Y-%m-%d") if isinstance(expiry_date, datetime) else "soon"
        item_name = item.get("name") or item.get("title") or "item"

        await db.notifications.insert_one({
            "userId": user_id,
            "type": "EXPIRING_FOOD",
            "message": f"Your {item_name} is about to expire on {expiry_text}. Please consume it.",
            "inventoryItemId": inventory_item_id,
            "isRead": False,
            "createdAt": now,
        })


async def generate_expiring_leftover_alerts(db, user_id: str):
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=3)

    cursor = db.leftovers.find({
        "user_id": user_id,
        "is_used": {"$ne": True},
        "expiry_date": {"$gte": now, "$lte": soon}
    })
    items = await cursor.to_list(length=None)

    for item in items:
        leftover_id = str(item["_id"])
        existing = await db.notifications.find_one({
            "userId": user_id,
            "leftoverId": leftover_id,
            "type": "EXPIRING_LEFTOVER",
        })
        if existing:
            continue

        expiry_date = item.get("expiry_date")
        days_left = (expiry_date - now).days if isinstance(expiry_date, datetime) else 0
        expiry_text = expiry_date.strftime("%Y-%m-%d") if isinstance(expiry_date, datetime) else "soon"
        item_name = item.get("name", "Leftover item")

        if days_left < 0:
            urgency = "has expired"
        elif days_left == 0:
            urgency = "expires today"
        else:
            urgency = f"expires in {days_left} day{'s' if days_left != 1 else ''} ({expiry_text})"

        await db.notifications.insert_one({
            "userId": user_id,
            "type": "EXPIRING_LEFTOVER",
            "message": f"🍽️ Leftover '{item_name}' {urgency}. Use it now or generate a recipe!",
            "leftoverId": leftover_id,
            "isRead": False,
            "createdAt": now,
        })


async def generate_meal_schedule_alerts(db, user_id: str):
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    tomorrow = (now.date() + timedelta(days=1)).isoformat()

    cursor = db.meal_schedules.find({
        "$or": [{"user_id": user_id}, {"user_id": "1"}],
        "meal_date": {"$in": [today, tomorrow]},
        "status": {"$nin": ["completed", "skipped"]}
    })
    meals = await cursor.to_list(length=None)

    for meal in meals:
        meal_id = str(meal["_id"])
        meal_date = meal.get("meal_date", "")
        meal_type = meal.get("meal_type", "meal").capitalize()
        recipe_title = meal.get("recipe_title", "")

        if not recipe_title:
            try:
                recipe = await db.recipes.find_one({"_id": ObjectId(meal["recipe_id"])})
                recipe_title = recipe.get("title", "Unknown Recipe") if recipe else "Unknown Recipe"
            except Exception:
                recipe_title = "Unknown Recipe"

        day_label = "today" if meal_date == today else "tomorrow"
        notif_type = f"MEAL_REMINDER_{meal_id}_{meal_date}"

        existing = await db.notifications.find_one({
            "userId": user_id,
            "mealId": meal_id,
            "type": notif_type,
        })
        if not existing:
            await db.notifications.insert_one({
                "userId": user_id,
                "type": notif_type,
                "message": f"📅 Reminder: {meal_type} '{recipe_title}' is planned for {day_label} ({meal_date}).",
                "mealId": meal_id,
                "isRead": False,
                "createdAt": now,
            })

        # Missing ingredients alert
        snapshot = meal.get("ingredients_snapshot", [])
        missing = [i["name"] for i in snapshot if i.get("missing")]
        if missing:
            missing_type = f"MEAL_MISSING_INGREDIENTS_{meal_id}"
            existing_missing = await db.notifications.find_one({
                "userId": user_id,
                "mealId": meal_id,
                "type": missing_type,
            })
            if not existing_missing:
                missing_str = ", ".join(missing[:5])
                await db.notifications.insert_one({
                    "userId": user_id,
                    "type": missing_type,
                    "message": f"⚠️ '{recipe_title}' ({day_label}) is missing ingredients: {missing_str}. Add them to your shopping list!",
                    "mealId": meal_id,
                    "isRead": False,
                    "createdAt": now,
                })


async def generate_budget_alerts(db, user_id: str):
    budget = await db.budgets.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not budget:
        return

    cursor = db.expenses.find({"user_id": user_id})
    expenses = await cursor.to_list(length=None)
    total_spent = sum(e.get("amount", 0) for e in expenses)
    budget_amount = budget.get("amount", 0)

    if budget_amount <= 0:
        return

    percentage_used = total_spent / budget_amount * 100
    now = datetime.now(timezone.utc)
    budget_id = str(budget["_id"])

    if percentage_used > 100:
        existing = await db.notifications.find_one({
            "userId": user_id,
            "type": "BUDGET_OVER",
            "budgetId": budget_id
        })
        if not existing:
            await db.notifications.insert_one({
                "userId": user_id,
                "type": "BUDGET_OVER",
                "message": f"🚨 Alert! You have exceeded your budget of ${budget_amount:.2f} by ${(total_spent - budget_amount):.2f}.",
                "budgetId": budget_id,
                "isRead": False,
                "createdAt": now,
            })
    elif percentage_used >= 80:
        existing = await db.notifications.find_one({
            "userId": user_id,
            "type": "BUDGET_WARNING",
            "budgetId": budget_id
        })
        if not existing:
            await db.notifications.insert_one({
                "userId": user_id,
                "type": "BUDGET_WARNING",
                "message": f"⚠️ Warning! You have used {percentage_used:.0f}% of your budget. Remaining: ${(budget_amount - total_spent):.2f}.",
                "budgetId": budget_id,
                "isRead": False,
                "createdAt": now,
            })


@router.get("/notifications")
async def get_user_notifications(
    unread: Optional[bool] = Query(False),
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()

    await generate_expiring_food_alerts(db, user_id)
    await generate_expiring_leftover_alerts(db, user_id)
    await generate_meal_schedule_alerts(db, user_id)
    await generate_budget_alerts(db, user_id)

    query = {
        "$or": [
            {"userId": user_id},
            {"userId": "ALL", "hiddenByUserIds": {"$ne": user_id}}
        ]
    }
    if unread:
        # For ALL, we only show if not in readByUserIds. For others, use isRead.
        query["$or"] = [
            {"userId": user_id, "isRead": False},
            {"userId": "ALL", "hiddenByUserIds": {"$ne": user_id}, "readByUserIds": {"$ne": user_id}}
        ]

    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifications = await cursor.to_list(length=None)
    return [serialize_notification(n) for n in notifications]


@router.put("/notifications/{notification_id}")
async def update_notification(
    notification_id: str,
    data: dict,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.get("userId") not in [user_id, "ALL"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this notification")

    if "isRead" in data and notification.get("userId") != "ALL":
        await db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"isRead": bool(data["isRead"])}}
        )

    updated = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    return serialize_notification(updated, user_id)


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.get("userId") not in [user_id, "ALL"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this notification")

    if notification.get("userId") != "ALL":
        await db.notifications.delete_one({"_id": ObjectId(notification_id)})

    return {"message": "Notification deleted"}
