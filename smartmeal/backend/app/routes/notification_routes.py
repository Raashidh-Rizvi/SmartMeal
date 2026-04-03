from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
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
    return notification

async def generate_expiring_food_alerts(db, user_id: str):
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=7)

    # Fetch inventory items that belong to the user and expire within 7 days
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
        message = f"Your {item_name} is about to expire on {expiry_text}. Please consume it."

        await db.notifications.insert_one({
            "userId": user_id,
            "type": "EXPIRING_FOOD",
            "message": message,
            "inventoryItemId": inventory_item_id,
            "isRead": False,
            "createdAt": now,
        })


async def generate_expiring_leftover_alerts(db, user_id: str):
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=3)  # Leftovers are more urgent — 3 days

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

        message = f"🍽️ Leftover '{item_name}' {urgency}. Use it now or generate a recipe!"

        await db.notifications.insert_one({
            "userId": user_id,
            "type": "EXPIRING_LEFTOVER",
            "message": message,
            "leftoverId": leftover_id,
            "isRead": False,
            "createdAt": now,
        })

async def generate_meal_schedule_alerts(db, user_id: str):
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    tomorrow = (now.date() + timedelta(days=1)).isoformat()

    # Fetch today's and tomorrow's planned meals
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

        # Resolve recipe title if not stored on meal
        if not recipe_title:
            try:
                recipe = await db.recipes.find_one({"_id": ObjectId(meal["recipe_id"])})
                recipe_title = recipe.get("title", "Unknown Recipe") if recipe else "Unknown Recipe"
            except Exception:
                recipe_title = "Unknown Recipe"

        is_today = meal_date == today
        day_label = "today" if is_today else "tomorrow"
        notif_type = f"MEAL_REMINDER_{meal_date}"

        # Daily reminder — once per meal per date
        existing = await db.notifications.find_one({
            "userId": user_id,
            "mealId": meal_id,
            "type": notif_type,
        })
        if not existing:
            await db.notifications.insert_one({
                "userId": user_id,
                "type": notif_type,
                "message": f"\ud83d\udcc5 Reminder: {meal_type} '{recipe_title}' is planned for {day_label} ({meal_date}).",
                "mealId": meal_id,
                "isRead": False,
                "createdAt": now,
            })

        # Missing ingredients alert — once per meal
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
                    "message": f"\u26a0\ufe0f '{recipe_title}' ({day_label}) is missing ingredients: {missing_str}. Add them to your shopping list!",
                    "mealId": meal_id,
                    "isRead": False,
                    "createdAt": now,
                })



    # Get current budget
    budget = await db.budgets.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not budget:
        return

    # Sum up expenses
    cursor = db.expenses.find({"user_id": user_id})
    expenses = await cursor.to_list(length=None)
    total_spent = sum(e.get("amount", 0) for e in expenses)
    budget_amount = budget.get("amount", 0)
    
    if budget_amount <= 0:
        return

    percentage_used = total_spent / budget_amount * 100
    now = datetime.now(timezone.utc)
    budget_id = str(budget["_id"])

    # If spent over 100%
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
                "message": f"Alert! You have exceeded your budget of ${budget_amount:.2f} by ${(total_spent - budget_amount):.2f}.",
                "budgetId": budget_id,
                "isRead": False,
                "createdAt": now,
            })
    # If spent over 80% but under 100%
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
                "message": f"Warning! You have used {percentage_used:.0f}% of your budget. Remaining: ${(budget_amount - total_spent):.2f}.",
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

    # Generate automatic system alerts before retrieving list
    await generate_expiring_food_alerts(db, user_id)
    await generate_expiring_leftover_alerts(db, user_id)
    await generate_meal_schedule_alerts(db, user_id)
    await generate_budget_alerts(db, user_id)

    query = {"userId": {"$in": [user_id, "ALL"]}}
    if unread:
        query["isRead"] = False

    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifications = await cursor.to_list(length=None)
    
    # Exclude system broadcast notifications that the user explicitly deleted (optional mapping logic, but simplified here we just return all active).
    return [serialize_notification(n) for n in notifications]


@router.put("/notifications/{notification_id}")
async def update_notification(
    notification_id: str,
    data: dict,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    # Ensure they can only update their own or broadcast
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.get("userId") not in [user_id, "ALL"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this notification")

    update_data = {}
    if "isRead" in data:
        update_data["isRead"] = bool(data["isRead"])

    if update_data:
        # If it's an ALL notification, users marking it read should actually just track logically that they read it.
        # But for MVP, let's keep it simple and update the single doc (affects everyone) 
        # OR handle user_read mapping if required. The MVP implementation writes directly.
        if notification.get("userId") == "ALL":
             # We won't mutate 'ALL' broadcast messages state to avoid affecting other users.
             pass
        else:
            await db.notifications.update_one({"_id": ObjectId(notification_id)}, {"$set": update_data})

    updated = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    return serialize_notification(updated)


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

    if notification.get("userId") == "ALL":
        # Don't delete broadcast message from system, instead soft hide it from user. MVP: Return success.
        pass
    else:
        await db.notifications.delete_one({"_id": ObjectId(notification_id)})

    return {"message": "Notification deleted"}
