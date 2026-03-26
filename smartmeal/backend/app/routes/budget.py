from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db

router = APIRouter()


class BudgetCreate(BaseModel):
    user_id: Optional[str] = "1"
    amount: float
    month: Optional[str] = None  # e.g. "2025-07"
    category: Optional[str] = "general"


class BudgetUpdate(BaseModel):
    amount: Optional[float] = None
    month: Optional[str] = None
    category: Optional[str] = None


class ExpenseCreate(BaseModel):
    user_id: Optional[str] = "1"
    description: str
    amount: float
    category: Optional[str] = "general"
    date: Optional[datetime] = None


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None


@router.post("/api/budget/budgets")
async def create_budget(data: BudgetCreate):
    db = get_db()
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.budgets.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.get("/api/budget/budgets/current")
async def get_current_budget():
    db = get_db()
    doc = await db.budgets.find_one({"user_id": "1"}, sort=[("created_at", -1)])
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/api/budget/budgets/{budget_id}")
async def update_budget(budget_id: str, data: BudgetUpdate):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    await db.budgets.update_one({"_id": ObjectId(budget_id)}, {"$set": update})
    doc = await db.budgets.find_one({"_id": ObjectId(budget_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Budget not found")
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/api/budget/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    db = get_db()
    result = await db.budgets.delete_one({"_id": ObjectId(budget_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "deleted"}


@router.post("/api/budget/expenses")
async def create_expense(data: ExpenseCreate):
    db = get_db()
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    if not doc.get("date"):
        doc["date"] = doc["created_at"]
    result = await db.expenses.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.get("/api/budget/expenses")
async def get_expenses(category: Optional[str] = None):
    db = get_db()
    query = {"user_id": "1"}
    if category:
        query["category"] = category
    cursor = db.expenses.find(query).sort("date", -1)
    items = await cursor.to_list(length=None)
    for item in items:
        item["_id"] = str(item["_id"])
    return items


@router.put("/api/budget/expenses/{expense_id}")
async def update_expense(expense_id: str, data: ExpenseUpdate):
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    await db.expenses.update_one({"_id": ObjectId(expense_id)}, {"$set": update})
    doc = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Expense not found")
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/api/budget/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    db = get_db()
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "deleted"}


@router.get("/api/budget/summary")
async def get_summary():
    db = get_db()
    budget = await db.budgets.find_one({"user_id": "1"}, sort=[("created_at", -1)])
    cursor = db.expenses.find({"user_id": "1"})
    expenses = await cursor.to_list(length=None)
    total_spent = sum(e.get("amount", 0) for e in expenses)
    budget_amount = budget.get("amount", 0) if budget else 0
    return {
        "budget": budget_amount,
        "spent": total_spent,
        "remaining": budget_amount - total_spent,
    }
