from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class ShoppingItemBase(BaseModel):
    user_id: str
    name: str
    quantity: float = 1.0
    unit: str = ""
    category: str = ""
    notes: str = ""
    status: str = "pending"
    source: str = "manual"  # "manual" or "auto"

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None

class ShoppingItemResponse(ShoppingItemBase):
    id: str = Field(alias="_id")

class GenerateShoppingListRequest(BaseModel):
    user_id: str
    meal_ids: Optional[List[str]] = []  # Specific meals; empty = all scheduled

class InventoryCheckResult(BaseModel):
    ingredient_name: str
    available_qty: float
    required_qty: float
    remaining_needed: float

class SubstitutionSuggestion(BaseModel):
    original: str
    alternatives: List[str]
    reason: str

class GenerateShoppingListResponse(BaseModel):
    generated_items: List[ShoppingItemResponse]
    inventory_deductions: List[InventoryCheckResult]
    substitutions: List[SubstitutionSuggestion] = []
    message: str

