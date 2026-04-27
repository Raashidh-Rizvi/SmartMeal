from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pydantic import BaseModel
from ..db.database import get_db
from ..api.deps import get_current_user_id
from ..utils.email import send_digest_email
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class NotificationUpdateBody(BaseModel):
    isRead: Optional[bool] = None


class NotificationPrefsBody(BaseModel):
    notificationsEnabled: Optional[bool] = None
    emailNotifications: Optional[bool] = None
    pushNotifications: Optional[bool] = None


def serialize_notification(notification: dict, user_id: str = None) -> dict:
    notification = dict(notification)
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
    now_naive = datetime.utcnow()
    soon_naive = now_naive + timedelta(days=7)

    cursor = db.inventory_items.find({
        "userId": user_id,
        "expiryDate": {"$gte": now_naive, "$lte": soon_naive}
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
    now_naive = datetime.utcnow()
    soon_naive = now_naive + timedelta(days=3)
    now_aware = datetime.now(timezone.utc)

    cursor = db.leftovers.find({
        "user_id": user_id,
        "is_used": {"$ne": True},
        "expiry_date": {"$gte": now_naive, "$lte": soon_naive}
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
        if isinstance(expiry_date, datetime):
            # normalise to naive UTC for safe arithmetic
            exp_naive = expiry_date.replace(tzinfo=None) if expiry_date.tzinfo else expiry_date
            days_left = (exp_naive - now_naive).days
            expiry_text = exp_naive.strftime("%Y-%m-%d")
        else:
            days_left = 0
            expiry_text = "soon"
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
            "createdAt": now_aware,
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
                "message": f"🚨 Alert! You have exceeded your budget of LKR {budget_amount:.2f} by LKR {(total_spent - budget_amount):.2f}.",
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
                "message": f"⚠️ Warning! You have used {percentage_used:.0f}% of your budget. Remaining: LKR {(budget_amount - total_spent):.2f}.",
                "budgetId": budget_id,
                "isRead": False,
                "createdAt": now,
            })


# ── GET notifications ──────────────────────────────────────────────────────────
@router.get("")
async def get_user_notifications(
    unread: Optional[bool] = Query(False),
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()

    # ── collect IDs that already exist before generation ──────────────────────
    existing_ids = set(
        str(n["_id"])
        for n in await db.notifications.find({"userId": user_id}).to_list(length=None)
    )

    # ── generate new notifications ────────────────────────────────────────────
    await generate_expiring_food_alerts(db, user_id)
    await generate_expiring_leftover_alerts(db, user_id)
    await generate_meal_schedule_alerts(db, user_id)
    await generate_budget_alerts(db, user_id)

    # ── find newly created ones ───────────────────────────────────────────────
    all_now = await db.notifications.find({"userId": user_id}).to_list(length=None)
    new_notifications = [n for n in all_now if str(n["_id"]) not in existing_ids]

    # ── send digest email if any new notifications were created ───────────────
    if new_notifications:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            email = user.get("email") if user else None
            if email:
                send_digest_email(email, new_notifications)
        except Exception as e:
            logger.error(f"[EMAIL] Could not send digest for user {user_id}: {e}")

    # ── return all notifications ──────────────────────────────────────────────
    query = {"isDeleted": {"$ne": True}}
    if unread:
        query["$or"] = [
            {"userId": user_id, "isRead": False},
            {"userId": "ALL", "hiddenByUserIds": {"$ne": user_id}, "readByUserIds": {"$ne": user_id}}
        ]
    else:
        query["$or"] = [
            {"userId": user_id},
            {"userId": "ALL", "hiddenByUserIds": {"$ne": user_id}}
        ]

    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifications = await cursor.to_list(length=None)
    return [serialize_notification(n, user_id) for n in notifications]


# ── GET notification preferences ───────────────────────────────────────────────
@router.get("/preferences")
async def get_notification_preferences(
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    prefs = await db.notification_preferences.find_one({"userId": user_id})
    if not prefs:
        # Return defaults
        return {
            "notificationsEnabled": True,
            "emailNotifications": True,
            "pushNotifications": True,
        }
    return {
        "notificationsEnabled": prefs.get("notificationsEnabled", True),
        "emailNotifications": prefs.get("emailNotifications", True),
        "pushNotifications": prefs.get("pushNotifications", True),
    }


# ── PUT notification preferences ───────────────────────────────────────────────
@router.put("/preferences")
async def update_notification_preferences(
    data: NotificationPrefsBody,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update notification preferences for the current user.
    Supports: notificationsEnabled, emailNotifications, pushNotifications
    """
    db = get_db()

    update_data = data.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid preference fields provided")

    await db.notification_preferences.update_one(
        {"userId": user_id},
        {"$set": update_data},
        upsert=True
    )

    prefs = await db.notification_preferences.find_one({"userId": user_id})
    return {
        "notificationsEnabled": prefs.get("notificationsEnabled", True),
        "emailNotifications": prefs.get("emailNotifications", True),
        "pushNotifications": prefs.get("pushNotifications", True),
        "message": "Preferences updated successfully"
    }


# ── PATCH mark-all-read ────────────────────────────────────────────────────────
@router.patch("/mark-all-read")
async def mark_all_notifications_read(
    user_id: str = Depends(get_current_user_id)
):
    """Mark all of the current user's personal notifications as read."""
    db = get_db()
    
    # Mark personal notifications as read
    result_personal = await db.notifications.update_many(
        {"userId": user_id, "isRead": False},
        {"$set": {"isRead": True}}
    )
    
    # Mark broadcast notifications as read (add user to readByUserIds)
    result_broadcast = await db.notifications.update_many(
        {"userId": "ALL", "readByUserIds": {"$ne": user_id}},
        {"$addToSet": {"readByUserIds": user_id}}
    )
    
    total_updated = result_personal.modified_count + result_broadcast.modified_count
    return {"message": "All notifications marked as read", "updated": total_updated}


# ── PUT individual notification ────────────────────────────────────────────────
@router.put("/{notification_id}")
async def update_notification(
    notification_id: str,
    data: NotificationUpdateBody,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    notification = await db.notifications.find_one({"_id": oid})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.get("userId") not in [user_id, "ALL"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this notification")

    if data.isRead is not None:
        if notification.get("userId") == "ALL":
            # For broadcast notifications track read per-user
            if data.isRead:
                await db.notifications.update_one(
                    {"_id": oid},
                    {"$addToSet": {"readByUserIds": user_id}}
                )
            else:
                await db.notifications.update_one(
                    {"_id": oid},
                    {"$pull": {"readByUserIds": user_id}}
                )
        else:
            await db.notifications.update_one(
                {"_id": oid},
                {"$set": {"isRead": bool(data.isRead)}}
            )

    updated = await db.notifications.find_one({"_id": oid})
    return serialize_notification(updated, user_id)


# ── DELETE individual notification ────────────────────────────────────────────
@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    notification = await db.notifications.find_one({"_id": oid})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.get("userId") not in [user_id, "ALL"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this notification")

    if notification.get("userId") == "ALL":
        # For broadcast notifications, hide it from this user instead of deleting
        await db.notifications.update_one(
            {"_id": oid},
            {"$addToSet": {"hiddenByUserIds": user_id}}
        )
    else:
        # For personal notifications, soft-delete to prevent re-generation
        await db.notifications.update_one(
            {"_id": oid},
            {"$set": {"isDeleted": True}}
        )

    return {"message": "Notification deleted"}
