from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from bson import ObjectId


class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class MealStatus(str, Enum):
    planned   = "planned"
    pending   = "pending"
    ready     = "ready"
    bought    = "bought"
    cooking   = "cooking"
    completed = "completed"
    skipped   = "skipped"


class MealScheduleBase(BaseModel):
    user_id: str
    recipe_id: str
    meal_date: date
    meal_type: MealType
    status: MealStatus = MealStatus.planned
    description: Optional[str] = Field(None, max_length=500)
    servings: int = Field(default=1, ge=1, le=20)
    notes: Optional[str] = Field(None, max_length=500)
    preparation_time: Optional[int] = Field(None, ge=0)
    tags: List[str] = Field(default_factory=list)
    cost_estimate: Optional[float] = Field(None, ge=0)


class MealScheduleCreate(MealScheduleBase):
    pass


class MealScheduleUpdate(BaseModel):
    meal_date: Optional[date] = None
    meal_type: Optional[MealType] = None
    status: Optional[MealStatus] = None
    description: Optional[str] = Field(None, max_length=500)
    servings: Optional[int] = Field(None, ge=1, le=20)
    notes: Optional[str] = Field(None, max_length=500)
    preparation_time: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    cost_estimate: Optional[float] = Field(None, ge=0)


class MealScheduleResponse(MealScheduleBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    recipe_title: Optional[str] = None
    recipe_category: Optional[str] = None
    total_calories_estimate: Optional[int] = None
    warnings: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
