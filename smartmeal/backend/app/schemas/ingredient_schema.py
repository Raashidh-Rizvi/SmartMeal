from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class IngredientBase(BaseModel):
    name: str
    category: str
    unit: str
    calories: int

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    calories: Optional[int] = None

class IngredientInDB(IngredientBase):
    id: Optional[str] = Field(alias="_id", default=None)
    createdAt: datetime
    updatedAt: datetime

class IngredientResponse(IngredientBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

class InventoryItemBase(BaseModel):
    userId: str
    name: str
    quantity: int = 1
    category: Optional[str] = None
    expiryDate: Optional[datetime] = None
    notes: Optional[str] = None

class InventoryItemCreate(BaseModel):
    name: str
    quantity: float = 1
    unit: Optional[str] = None
    category: Optional[str] = None
    expiryDate: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator('expiryDate')
    @classmethod
    def expiry_not_past(cls, v):
        if v is not None:
            now = datetime.now(v.tzinfo) if v.tzinfo else datetime.now()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            if v < today:
                raise ValueError('Expiry date cannot be in the past')
        return v

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    expiryDate: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator('expiryDate')
    @classmethod
    def expiry_not_past(cls, v):
        if v is not None:
            now = datetime.now(v.tzinfo) if v.tzinfo else datetime.now()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            if v < today:
                raise ValueError('Expiry date cannot be in the past')
        return v

class InventoryItemInDB(InventoryItemBase):
    id: Optional[str] = Field(alias="_id", default=None)
    createdAt: datetime
    updatedAt: datetime

class InventoryItemResponse(InventoryItemBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime