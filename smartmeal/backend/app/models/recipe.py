from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Category(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str


class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[Ingredient] = []
    preparation_steps: List[str] = []
    category: Category
    dietary_tags: List[str] = []
    estimated_cooking_time: Optional[int] = None  # in minutes
    image_url: Optional[str] = None  # External image URL


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[Ingredient]] = None
    preparation_steps: Optional[List[str]] = None
    category: Optional[Category] = None
    dietary_tags: Optional[List[str]] = None
    estimated_cooking_time: Optional[int] = None
    image_url: Optional[str] = None


class RecipeInDB(RecipeBase):
    id: Optional[str] = Field(alias="_id", default=None)
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class RecipeResponse(RecipeBase):
    id: str = Field(alias="_id")
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
