from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RecipeRating(BaseModel):
    recipe_id: str
    user_id: str
    rating: int = Field(..., ge=1, le=5)
    created_at: datetime = Field(default_factory=lambda: datetime.now())

class RecipeRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)