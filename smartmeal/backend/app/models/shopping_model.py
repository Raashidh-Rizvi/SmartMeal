"""
Shopping Model
Database models for shopping items.
Uses snake_case to match Python backend conventions.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ItemStatus(str, Enum):
    """Status enumeration for shopping items"""
    PENDING = "Pending"
    BOUGHT = "Bought"


class ItemSource(str, Enum):
    """Source enumeration for shopping items"""
    MANUAL = "Manual"
    MEAL_PLAN = "MealPlan"


class ShoppingItem(BaseModel):
    """Full shopping item model with all fields"""
    id: Optional[str] = None
    user_id: str = Field(..., alias="user_id")
    item_name: str = Field(..., alias="item_name")
    quantity: float = 1
    unit: str = "piece"
    status: ItemStatus = ItemStatus.PENDING
    source: ItemSource = ItemSource.MANUAL
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
        populate_by_alias = True


class ShoppingItemCreate(BaseModel):
    """Model for creating a new shopping item"""
    user_id: str = Field(..., alias="user_id")
    item_name: str = Field(..., alias="item_name")
    quantity: float = 1
    unit: str = "piece"
    source: ItemSource = ItemSource.MANUAL

    class Config:
        populate_by_name = True
        populate_by_alias = True


class ShoppingItemUpdate(BaseModel):
    """Model for updating an existing shopping item"""
    item_name: Optional[str] = Field(None, alias="item_name")
    quantity: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[ItemStatus] = None
    source: Optional[ItemSource] = None

    class Config:
        populate_by_name = True
        populate_by_alias = True


# Backward compatibility - rebuild models
ShoppingItem.model_rebuild()
ShoppingItemCreate.model_rebuild()
ShoppingItemUpdate.model_rebuild()
