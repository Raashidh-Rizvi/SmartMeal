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
