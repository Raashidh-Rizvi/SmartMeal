from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from ..db.database import get_db
from ..schemas.recipe_schema import RecipeCreate, RecipeUpdate, RecipeResponse
from ..services.recommendation import get_recipe_recommendations
from ..services.output_service import filter_recipes, format_output, limit_results

<<<<<<< HEAD
router = APIRouter()
=======
router = APIRouter(tags=["recipes"])
>>>>>>> 9d9d7c9b16919c6ddd1d20f674ad36dd7f8dfa1a


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


@router.delete("/{recipe_id}")
async def delete_recipe(recipe_id: str):
    db = get_db()
    if not ObjectId.is_valid(recipe_id):
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

    existing = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Recipe not found")

    await db.recipes.delete_one({"_id": ObjectId(recipe_id)})
    return {"message": "Recipe deleted successfully"}


@router.post("/recommend")
async def recommend_recipes(preferences: Dict[str, Any]):
    """
    Member 3: AI Recommendations → Filter → Limit → Format → Safe Output
    diet (veg/non-veg), cooking_time_max (minutes), exclude_ingredient (allergies)
    """
    # Step 1: Get AI recommendations (Member 2)
    ai_results = get_recipe_recommendations(preferences)
    
    # Step 2: Filter by preferences (diet, allergies, cooking time)
    filtered = filter_recipes(ai_results, preferences)
    
    # Step 3: Limit to top 5
    limited = limit_results(filtered)
    
    # Step 4: Format with explanations
    user_ingredients = preferences.get("ingredients", "")
    formatted = format_output(limited, user_ingredients)
    
    return formatted

