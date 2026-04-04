from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..schemas.recipe_schema import RecipeCreate, RecipeUpdate, RecipeResponse
from ..schemas.rating_schema import RecipeRatingCreate
from ..services.recommendation import get_recipe_recommendations
from ..services.output_service import filter_recipes, format_output, limit_results

router = APIRouter(tags=["recipes"])


@router.get("/by-type/{meal_type}")
async def get_recipes_by_type(meal_type: str):
    db = get_db()
    cursor = db.recipes.find({"category": meal_type.lower()}).sort("title", 1)
    recipes = await cursor.to_list(length=None)
    for r in recipes:
        r["_id"] = str(r["_id"])
    return recipes


@router.get("/", response_model=List[RecipeResponse])
async def get_recipes(
    search: Optional[str] = None,
    category: Optional[str] = None,
    created_by: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=200)
):
    db = get_db()
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    if category:
        query["category"] = category
    if created_by:
        query["created_by"] = created_by

    cursor = db.recipes.find(query).skip(skip).limit(limit).sort("created_at", -1)
    recipes = await cursor.to_list(length=limit)
    for recipe in recipes:
        recipe["_id"] = str(recipe["_id"])
    return recipes


@router.post("/", response_model=RecipeResponse)
async def create_recipe(recipe_in: RecipeCreate):
    db = get_db()
    now = datetime.now(timezone.utc)
    recipe_data = recipe_in.model_dump()
    recipe_data["created_by"] = "1"
    recipe_data["created_at"] = now
    recipe_data["updated_at"] = now

    result = await db.recipes.insert_one(recipe_data)
    created_recipe = await db.recipes.find_one({"_id": result.inserted_id})
    created_recipe["_id"] = str(created_recipe["_id"])
    return created_recipe


@router.get("/recommendations")
async def get_recommendations(
    spicy: Optional[bool] = None,
    cooking_time_max: Optional[int] = None,
    diet: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get filtered recipe recommendations based on user preferences.
    Filters: spicy (bool), cooking_time_max (minutes), diet (veg/non-veg)
    Returns recipes sorted by average_rating descending.
    """
    db = get_db()
    query = {}

    if spicy is not None:
        if spicy:
            query["dietary_tags"] = {"$in": ["spicy"]}
        else:
            query["dietary_tags"] = {"$nin": ["spicy"]}

    if cooking_time_max is not None:
        query["estimated_cooking_time"] = {"$lte": cooking_time_max}

    if diet:
        if diet.lower() == "veg":
            query["dietary_tags"] = {"$in": ["vegetarian", "vegan"]}
        elif diet.lower() == "non-veg":
            query["dietary_tags"] = {"$nin": ["vegetarian", "vegan"]}

    cursor = db.recipes.find(query).sort("average_rating", -1).limit(limit)
    recipes = await cursor.to_list(length=limit)
    for recipe in recipes:
        recipe["_id"] = str(recipe["_id"])
    return recipes


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: str):
    db = get_db()
    if not ObjectId.is_valid(recipe_id):
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

    recipe = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe["_id"] = str(recipe["_id"])
    return recipe


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(recipe_id: str, recipe_in: RecipeUpdate):
    db = get_db()
    if not ObjectId.is_valid(recipe_id):
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

    existing = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Recipe not found")

    update_data = recipe_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.recipes.update_one({"_id": ObjectId(recipe_id)}, {"$set": update_data})

    updated_recipe = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
    updated_recipe["_id"] = str(updated_recipe["_id"])
    return updated_recipe


@router.post("/{recipe_id}/rate")
async def rate_recipe(recipe_id: str, rating_in: RecipeRatingCreate):
    """
    Rate a recipe (1-5 stars). Updates the average rating.
    """
    from ..deps import get_current_user
    from fastapi import Depends
    from ..schemas.rating_schema import RecipeRatingCreate

    # Note: This would need authentication, but for simplicity, assuming user_id is passed or from auth
    # For now, we'll simulate with a dummy user_id
    user_id = "dummy_user"  # In real app, get from auth

    db = get_db()
    if not ObjectId.is_valid(recipe_id):
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

    recipe = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Check if user already rated
    existing_rating = await db.recipe_ratings.find_one({"recipe_id": recipe_id, "user_id": user_id})
    if existing_rating:
        # Update existing rating
        await db.recipe_ratings.update_one(
            {"recipe_id": recipe_id, "user_id": user_id},
            {"$set": {"rating": rating_in.rating}}
        )
    else:
        # Insert new rating
        rating_data = {
            "recipe_id": recipe_id,
            "user_id": user_id,
            "rating": rating_in.rating,
            "created_at": datetime.now(timezone.utc)
        }
        await db.recipe_ratings.insert_one(rating_data)

    # Recalculate average rating
    ratings_cursor = db.recipe_ratings.find({"recipe_id": recipe_id})
    ratings = await ratings_cursor.to_list(length=None)
    if ratings:
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
        await db.recipes.update_one(
            {"_id": ObjectId(recipe_id)},
            {"$set": {"average_rating": avg_rating}}
        )

    return {"message": "Rating submitted successfully"}

