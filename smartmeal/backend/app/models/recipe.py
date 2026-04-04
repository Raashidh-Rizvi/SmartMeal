from pydantic import BaseModel, Field, field_validator, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Category(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class Ingredient(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    quantity: float = Field(..., gt=0, le=9999)
    unit: str = Field(..., min_length=1, max_length=50)

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Ingredient name cannot be empty or whitespace only")
        if len(v) > 100:
            raise ValueError("Ingredient name must not exceed 100 characters")
        return v.strip()

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("Ingredient quantity must be greater than 0")
        if v > 9999:
            raise ValueError("Ingredient quantity cannot exceed 9999")
        return v

    @field_validator('unit')
    @classmethod
    def validate_unit(cls, v):
        if not v or not v.strip():
            raise ValueError("Unit cannot be empty")
        valid_units = {"g", "kg", "ml", "l", "cup", "tbsp", "tsp", "oz", "lb", "pinch", "piece", "pieces"}
        if v.lower() not in valid_units:
            raise ValueError(
                "Unit is invalid. Please use one of: "
                + ", ".join(sorted(valid_units))
            )
        return v.lower()


class RecipeBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    ingredients: List[Ingredient] = Field(default_factory=list, min_length=1)
    preparation_steps: List[str] = Field(default_factory=list, min_length=1)
    category: Category
    dietary_tags: List[str] = Field(default_factory=list, max_length=20)
    estimated_cooking_time: Optional[int] = Field(None, ge=1, le=1440)  # 1 minute to 24 hours
    image_url: Optional[str] = None

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError("Title is required and cannot be empty")
        
        title = v.strip()
        
        # Check length first
        if len(title) < 3:
            raise ValueError("Title must be at least 3 characters long")
        if len(title) > 200:
            raise ValueError("Title cannot exceed 200 characters")
        
        # Check if contains only letters (and spaces)
        if not all(c.isalpha() or c.isspace() for c in title):
            raise ValueError("Title must contain only letters (a-z, A-Z) and spaces. Numbers and special characters are not allowed")
        
        return title

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError("Description must not exceed 2000 characters")
        return v

    @field_validator('ingredients')
    @classmethod
    def validate_ingredients(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Recipe must have at least one ingredient")
        if len(v) > 100:
            raise ValueError("Recipe cannot have more than 100 ingredients")
        return v

    @field_validator('preparation_steps')
    @classmethod
    def validate_preparation_steps(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Recipe must have at least one preparation step")
        for i, step in enumerate(v):
            if not step or not step.strip():
                raise ValueError(f"Step {i+1} cannot be empty")
            if len(step) > 1000:
                raise ValueError(f"Step {i+1} cannot exceed 1000 characters")
        if len(v) > 50:
            raise ValueError("Recipe cannot have more than 50 preparation steps")
        return [s.strip() for s in v]

    @field_validator('dietary_tags', mode='before')
    @classmethod
    def validate_dietary_tags(cls, v):
        if isinstance(v, str):
            # Only comma-separated values are allowed, not semicolon-separated.
            if ';' in v:
                raise ValueError("Dietary tags should be separated by commas only, not semicolons")
            if not v.strip():
                return []
            v = [tag.strip() for tag in v.split(',') if tag.strip()]

        if not isinstance(v, list):
            raise ValueError("Dietary tags must be a list or comma-separated string")

        if len(v) > 20:
            raise ValueError("Maximum 20 dietary tags allowed")

        valid_tags = {
            "vegetarian", "vegan", "gluten-free", "dairy-free", 
            "nut-free", "keto", "low-carb", "high-protein", "paleo",
            "organic", "locally-sourced", "sugar-free", "halal", "kosher"
        }

        # If using list, each list entry must be a recognized tag; semicolons are invalid.
        for tag_item in v:
            if isinstance(tag_item, str) and ';' in tag_item:
                raise ValueError("Dietary tags should be separated by commas only, not semicolons")

        invalid_tags = []
        for tag in v:
            if not isinstance(tag, str) or tag.lower() not in valid_tags:
                invalid_tags.append(tag)

        if invalid_tags:
            invalid_list = ', '.join(f"'{str(t)}'" for t in invalid_tags)
            raise ValueError(
                f"Oops! We don't recognize {invalid_list}. "
                f"Please choose from our supported list: {', '.join(sorted(valid_tags))}."
            )

        return [t.lower() for t in v]

    @field_validator('estimated_cooking_time')
    @classmethod
    def validate_cooking_time(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError("Cooking time must be at least 1 minute")
            if v > 1440:
                raise ValueError("Cooking time cannot exceed 1440 minutes (24 hours)")
        return v

    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v):
        if v is not None:
            if not v.startswith(('http://', 'https://', '/static/')):
                raise ValueError("Image URL must start with http://, https://, or /static/")
            if len(v) > 2000:
                raise ValueError("Image URL must not exceed 2000 characters")
        return v


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


# For reading from database - no validation on existing data
class RecipeResponseRaw(BaseModel):
    """Response model for reading recipes from database without re-validating"""
    id: str = Field(alias="_id")
    title: str
    description: Optional[str] = None
    ingredients: List[dict] = []  # Allow raw dicts from DB, default empty
    preparation_steps: List[str] = []  # Default empty
    category: str = "snack"  # Default category
    dietary_tags: List[str] = []
    estimated_cooking_time: Optional[int] = None
    image_url: Optional[str] = None
    created_by: Optional[str] = None  # Optional in case old data missing
    created_at: Optional[datetime] = None  # Optional in case old data missing
    updated_at: Optional[datetime] = None  # Optional in case old data missing

    class Config:
        populate_by_name = True


class RecipeResponse(RecipeBase):
    id: str = Field(alias="_id")
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True