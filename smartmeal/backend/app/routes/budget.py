from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..api.deps import get_current_user_id

router = APIRouter()


class BudgetCreate(BaseModel):
    amount: float
    month: Optional[str] = None  # e.g. "2025-07"
    category: Optional[str] = "general"


class BudgetUpdate(BaseModel):
    amount: Optional[float] = None
    month: Optional[str] = None
    category: Optional[str] = None


class ExpenseCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    amount: float
    category: Optional[str] = "general"
    date: Optional[datetime] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None


def serialize_expense(doc: dict) -> dict:
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def serialize_budget(doc: dict) -> dict:
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/api/budget/budgets")
async def create_budget(
    data: BudgetCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    doc = data.model_dump()
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.budgets.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_budget(doc)


@router.get("/api/budget/budgets/current")
async def get_current_budget(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = await db.budgets.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not doc:
        return None
    return serialize_budget(doc)


@router.put("/api/budget/budgets/{budget_id}")
async def update_budget(
    budget_id: str,
    data: BudgetUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    result = await db.budgets.update_one(
        {"_id": ObjectId(budget_id), "user_id": user_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found or unauthorized")
    doc = await db.budgets.find_one({"_id": ObjectId(budget_id)})
    return serialize_budget(doc)


@router.delete("/api/budget/budgets/{budget_id}")
async def delete_budget(
    budget_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    result = await db.budgets.delete_one({"_id": ObjectId(budget_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found or unauthorized")
    return {"message": "deleted"}


@router.post("/api/budget/expenses")
async def create_expense(
    data: ExpenseCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    doc = data.model_dump()
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc)
    if not doc.get("date"):
        doc["date"] = doc["created_at"]
    result = await db.expenses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_expense(doc)


@router.get("/api/budget/expenses")
async def get_expenses(
    category: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    query = {"user_id": user_id}
    if category:
        query["category"] = category
    cursor = db.expenses.find(query).sort("date", -1)
    items = await cursor.to_list(length=None)
    return [serialize_expense(item) for item in items]


@router.put("/api/budget/expenses/{expense_id}")
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    result = await db.expenses.update_one(
        {"_id": ObjectId(expense_id), "user_id": user_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found or unauthorized")
    doc = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    return serialize_expense(doc)


@router.delete("/api/budget/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_db()
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found or unauthorized")
    return {"message": "deleted"}


@router.get("/api/budget/summary")
async def get_summary(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    budget = await db.budgets.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    cursor = db.expenses.find({"user_id": user_id})
    expenses = await cursor.to_list(length=None)
    total_spent = sum(e.get("amount", 0) for e in expenses)
    budget_amount = budget.get("amount", 0) if budget else 0
    remaining = budget_amount - total_spent
    percentage_used = (total_spent / budget_amount * 100) if budget_amount > 0 else 0
    is_over_budget = remaining < 0
    warning_threshold_reached = percentage_used >= 80 and not is_over_budget

    budget_data = None
    if budget:
        budget["_id"] = str(budget["_id"])
        budget_data = budget

    return {
        "budget": budget_data,
        "total_spent": total_spent,
        "remaining": remaining,
        "percentage_used": percentage_used,
        "is_over_budget": is_over_budget,
        "warning_threshold_reached": warning_threshold_reached,
        "expenses_count": len(expenses),
    }
