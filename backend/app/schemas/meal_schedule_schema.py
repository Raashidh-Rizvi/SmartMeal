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
    planned = "planned"
    done = "done"
    skipped = "skipped"
    cancelled = "cancelled"

class MealScheduleBase(BaseModel):
    user_id: str = Field(..., description="Reference to user ObjectId")
    recipe_id: str = Field(..., description="Reference to recipe ObjectId")
    meal_date: date = Field(..., description="Date of the meal")
    meal_type: MealType = Field(..., description="Type of meal")
    status: MealStatus = Field(default=MealStatus.planned, description="Current status of the meal")
    servings: int = Field(default=1, ge=1, le=20, description="Number of servings planned")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the meal")
    preparation_time: Optional[int] = Field(None, ge=0, description="Estimated preparation time in minutes")
    tags: List[str] = Field(default_factory=list, description="Meal tags (e.g., quick, healthy, vegetarian)")
    cost_estimate: Optional[float] = Field(None, ge=0, description="Estimated cost of ingredients")

class MealScheduleCreate(MealScheduleBase):
    pass

class MealScheduleUpdate(BaseModel):
    meal_date: Optional[date] = None
    meal_type: Optional[MealType] = None
    status: Optional[MealStatus] = None
    servings: Optional[int] = Field(None, ge=1, le=20)
    notes: Optional[str] = Field(None, max_length=500)
    preparation_time: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    cost_estimate: Optional[float] = Field(None, ge=0)

class MealScheduleInDB(MealScheduleBase):
    id: Optional[str] = Field(alias="_id", default=None)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    rating: Optional[int] = Field(None, ge=1, le=5, description="User rating 1-5 stars")

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

class MealScheduleResponse(MealScheduleBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    # Additional computed fields
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