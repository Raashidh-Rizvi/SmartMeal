from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    userId: str
    name: str
    quantity: int = 1
    category: Optional[str] = None
    expiryDate: Optional[datetime] = None
    notes: Optional[str] = None

class InventoryItemCreate(BaseModel):
    name: str
    quantity: int = 1
    category: Optional[str] = None
    expiryDate: Optional[datetime] = None
    notes: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    expiryDate: Optional[datetime] = None
    notes: Optional[str] = None

class InventoryItemInDB(InventoryItemBase):
    id: Optional[str] = Field(alias="_id", default=None)
    createdAt: datetime
    updatedAt: datetime

class InventoryItemResponse(InventoryItemBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime
