from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse,
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    BudgetSummary
)
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/budget", tags=["budget"])

def budget_helper(budget) -> dict:
    return {
        "id": str(budget["_id"]),
        "amount": budget["amount"],
        "period": budget["period"],
        "start_date": budget["start_date"],
        "created_at": budget["created_at"]
    }

def expense_helper(expense) -> dict:
    return {
        "id": str(expense["_id"]),
        "item_name": expense["item_name"],
        "amount": expense["amount"],
        "category": expense["category"],
        "date": expense["date"],
        "notes": expense.get("notes"),
        "created_at": expense["created_at"]
    }

def get_period_dates(budget):
    start = budget["start_date"]
    if budget["period"] == "weekly":
        end = start + timedelta(days=7)
    else:
        end = start + timedelta(days=30)
    return start, end

async def calculate_summary(db):
    budget = await db.budgets.find_one({}, sort=[("created_at", -1)])
    
    if not budget:
        return {
            "budget": None,
            "total_spent": 0.0,
            "remaining": 0.0,
            "expenses_count": 0,
            "is_over_budget": False,
            "percentage_used": 0.0,
            "warning_threshold_reached": False
        }
    
    start_date, end_date = get_period_dates(budget)
    
    expenses = await db.expenses.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }).to_list(1000)
    
    total_spent = sum(exp["amount"] for exp in expenses)
    remaining = budget["amount"] - total_spent
    is_over_budget = total_spent > budget["amount"]
    percentage_used = (total_spent / budget["amount"]) * 100 if budget["amount"] > 0 else 0
    warning_threshold_reached = percentage_used >= 80
    
    return {
        "budget": budget_helper(budget),
        "total_spent": round(total_spent, 2),
        "remaining": round(remaining, 2),
        "expenses_count": len(expenses),
        "is_over_budget": is_over_budget,
        "percentage_used": round(percentage_used, 2),
        "warning_threshold_reached": warning_threshold_reached
    }

@router.post("/budgets", response_model=BudgetResponse, status_code=201)
async def create_budget(budget: BudgetCreate):
    db = await get_database()
    budget_dict = budget.model_dump()
    budget_dict["created_at"] = datetime.now()
    
    result = await db.budgets.insert_one(budget_dict)
    new_budget = await db.budgets.find_one({"_id": result.inserted_id})
    return budget_helper(new_budget)

@router.get("/budgets/current", response_model=BudgetResponse)
async def get_current_budget():
    db = await get_database()
    budget = await db.budgets.find_one({}, sort=[("created_at", -1)])
    if not budget:
        raise HTTPException(status_code=404, detail="No budget found")
    return budget_helper(budget)

@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, budget_update: BudgetUpdate):
    db = await get_database()
    if not ObjectId.is_valid(budget_id):
        raise HTTPException(status_code=400, detail="Invalid budget ID")
    
    update_data = {k: v for k, v in budget_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.budgets.update_one(
        {"_id": ObjectId(budget_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    updated_budget = await db.budgets.find_one({"_id": ObjectId(budget_id)})
    return budget_helper(updated_budget)

@router.delete("/budgets/{budget_id}", status_code=204)
async def delete_budget(budget_id: str):
    db = await get_database()
    if not ObjectId.is_valid(budget_id):
        raise HTTPException(status_code=400, detail="Invalid budget ID")
    
    result = await db.budgets.delete_one({"_id": ObjectId(budget_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")

@router.post("/expenses", response_model=ExpenseResponse, status_code=201)
async def create_expense(expense: ExpenseCreate):
    db = await get_database()
    expense_dict = expense.model_dump()
    expense_dict["created_at"] = datetime.now()
    
    result = await db.expenses.insert_one(expense_dict)
    new_expense = await db.expenses.find_one({"_id": result.inserted_id})
    return expense_helper(new_expense)

@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None
):
    db = await get_database()
    query = {}
    
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date
    
    if category:
        query["category"] = category
    
    expenses = await db.expenses.find(query).sort("date", -1).to_list(1000)
    return [expense_helper(exp) for exp in expenses]

@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: str):
    db = await get_database()
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense_helper(expense)

@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense_update: ExpenseUpdate):
    db = await get_database()
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    update_data = {k: v for k, v in expense_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.expenses.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    updated_expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    return expense_helper(updated_expense)

@router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(expense_id: str):
    db = await get_database()
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

@router.get("/summary", response_model=BudgetSummary)
async def get_budget_summary():
    db = await get_database()
    return await calculate_summary(db)
