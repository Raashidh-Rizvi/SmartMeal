from pydantic import BaseModel, Field
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