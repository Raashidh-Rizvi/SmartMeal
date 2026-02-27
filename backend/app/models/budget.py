from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timezone
from enum import Enum

class BudgetPeriod(str, Enum):
    weekly = "weekly"
    monthly = "monthly"

class BudgetCreate(BaseModel):
    amount: float = Field(gt=0, description="Budget amount must be positive")
    period: BudgetPeriod
    start_date: datetime

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Budget amount must be positive')
        return v

class BudgetUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    period: Optional[BudgetPeriod] = None
    start_date: Optional[datetime] = None

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Budget amount must be positive')
        return v

class BudgetResponse(BaseModel):
    id: str
    amount: float
    period: BudgetPeriod
    start_date: datetime
    created_at: datetime

class ExpenseCreate(BaseModel):
    item_name: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0, description="Amount must be positive")
    category: str = Field(min_length=1, max_length=50)
    date: datetime
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator('item_name')
    @classmethod
    def item_name_required(cls, v):
        if not v or not v.strip():
            raise ValueError('Item name is required')
        return v.strip()

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return round(v, 2)

    @field_validator('category')
    @classmethod
    def category_required(cls, v):
        if not v or not v.strip():
            raise ValueError('Category is required')
        return v.strip()

    @field_validator('date')
    @classmethod
    def date_not_future(cls, v):
        return v

class ExpenseUpdate(BaseModel):
    item_name: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be positive')
        return round(v, 2) if v else v

    @field_validator('date')
    @classmethod
    def date_not_future(cls, v):
        return v

class ExpenseResponse(BaseModel):
    id: str
    item_name: str
    amount: float
    category: str
    date: datetime
    notes: Optional[str]
    created_at: datetime

class BudgetSummary(BaseModel):
    budget: Optional[BudgetResponse]
    total_spent: float
    remaining: float
    expenses_count: int
    is_over_budget: bool
    percentage_used: float
    warning_threshold_reached: bool
