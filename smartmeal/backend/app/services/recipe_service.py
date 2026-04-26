from datetime import datetime, timezone
from typing import Any, List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from ..models.recipe import RecipeCreate, RecipeUpdate, RecipeResponse, RecipeResponseRaw
import re
import logging

logger = logging.getLogger(__name__)


def _validate_object_id(recipe_id: str) -> ObjectId:
    """Validate and return ObjectId or raise 422."""
    try:
        return ObjectId(recipe_id)
    except (InvalidId, Exception) as e:
        logger.warning(f"Invalid recipe ID format: {recipe_id}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid recipe ID format. Expected 24-character hex string."
        )


def _escape_regex(text: str) -> str:
    """Escape special regex characters to prevent regex injection."""
    if not text:
        return ""
    return re.escape(text)


def _serialize(doc: dict) -> dict:
    """Convert MongoDB document _id to string for response."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def create_recipe(db, data: RecipeCreate, user_id: str) -> RecipeResponse:
    """
    Create a new recipe with validated data.
    
    Args:
        db: MongoDB database connection
        data: RecipeCreate model (already validated by Pydantic)
        user_id: ID of the recipe creator
    
    Returns:
        RecipeResponse: Created recipe with all fields
    
    Raises:
        HTTPException: On database errors or validation failures
    """
    try:
        now = datetime.now(timezone.utc)
        recipe_dict = data.model_dump()
        # Serialize nested Ingredient objects
        recipe_dict["ingredients"] = [ing.model_dump() for ing in data.ingredients]
        recipe_dict["created_by"] = user_id
        recipe_dict["created_at"] = now
        recipe_dict["updated_at"] = now

        result = await db["recipes"].insert_one(recipe_dict)
        created = await db["recipes"].find_one({"_id": result.inserted_id})
        
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created recipe"
            )
        
        return RecipeResponse(**_serialize(created))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create recipe. Please try again."
        )


async def get_recipes_by_meal_type(db, meal_type: str) -> List[dict[str, Any]]:
    """
    Get recipes filtered by meal type/category.
    
    Args:
        db: MongoDB database connection
        meal_type: Category filter (breakfast, lunch, dinner, snack)
    
    Returns:
        List of matching recipes
    
    Raises:
        HTTPException: On invalid meal type or database errors
    """
    try:
        valid_types = {"breakfast", "lunch", "dinner", "snack"}
        meal_type_lower = meal_type.strip().lower()
        
        if meal_type_lower not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid meal type '{meal_type}'. Must be one of: {', '.join(valid_types)}"
            )
        
        query = {"category": meal_type_lower}
        cursor = db["recipes"].find(query).sort("title", 1)
        recipes = await cursor.to_list(length=500)
        
        for r in recipes:
            r["_id"] = str(r["_id"])
        
        return recipes
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipes by meal type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recipes"
        )


async def get_all_recipes(
    db,
    search: Optional[str] = None,
    category: Optional[str] = None,
    created_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[dict]:
    """
   Get all recipes with optional filtering and search - returns raw dictionaries.
    
    Args:
        db: MongoDB database connection
        search: Search term for title/description (regex escaped)
        category: Filter by category
        created_by: Filter by creator user ID
        skip: Number of records to skip (pagination)
        limit: Maximum records to return (pagination)
    
    Returns:
        List of recipe dictionaries (raw from DB)
    
    Raises:
        HTTPException: On database errors
    """
    try:
        query: dict = {}

        # Use regex-escaped search to prevent injection
        if search and search.strip():
            escaped_search = _escape_regex(search.strip())
            query["$or"] = [
                {"title": {"$regex": escaped_search, "$options": "i"}},
                {"description": {"$regex": escaped_search, "$options": "i"}},
            ]

        if category:
            valid_categories = {"breakfast", "lunch", "dinner", "snack"}
            # Convert enum to string if needed
            category_str = category.value if hasattr(category, 'value') else str(category)
            if category_str not in valid_categories:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid category '{category_str}'. Must be one of: {', '.join(valid_categories)}"
                )
            query["category"] = category_str

        if created_by:
            query["created_by"] = created_by

        cursor = (
            db["recipes"]
            .find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        
        recipes = []
        async for doc in cursor:
            # Convert _id to string and return raw dict
            doc["_id"] = str(doc["_id"])
            recipes.append(doc)
        
        return recipes
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


async def get_recipe_by_id(db, recipe_id: str) -> RecipeResponseRaw:
    """
    Retrieve a single recipe by ID.
    
    Args:
        db: MongoDB database connection
        recipe_id: Recipe ObjectId as string
    
    Returns:
        RecipeResponseRaw: The recipe (without re-validating old data)
    
    Raises:
        HTTPException: If recipe not found or ID invalid
    """
    try:
        oid = _validate_object_id(recipe_id)
        doc = await db["recipes"].find_one({"_id": oid})
        
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recipe not found"
            )
        
        return RecipeResponseRaw(**_serialize(doc))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recipe"
        )


async def update_recipe(
    db, recipe_id: str, data: RecipeUpdate, user_id: str
) -> RecipeResponse:
    """
    Update a recipe. Only the creator can update.
    
    Args:
        db: MongoDB database connection
        recipe_id: Recipe ObjectId as string
        data: RecipeUpdate model with fields to update
        user_id: ID of the user attempting update
    
    Returns:
        RecipeResponse: Updated recipe
    
    Raises:
        HTTPException: If not authorized, recipe not found, or validation fails
    """
    try:
        oid = _validate_object_id(recipe_id)

        existing = await db["recipes"].find_one({"_id": oid})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )

        if existing["created_by"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this recipe"
            )

        update_fields = data.model_dump(exclude_unset=True)

        # Serialize Ingredient objects if present
        if "ingredients" in update_fields and update_fields["ingredients"] is not None:
            update_fields["ingredients"] = [
                ing.model_dump() if hasattr(ing, "model_dump") else ing
                for ing in update_fields["ingredients"]
            ]

        update_fields["updated_at"] = datetime.now(timezone.utc)

        result = await db["recipes"].update_one({"_id": oid}, {"$set": update_fields})
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )
        
        updated = await db["recipes"].find_one({"_id": oid})
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated recipe"
            )
        
        return RecipeResponse(**_serialize(updated))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update recipe"
        )


async def delete_recipe(db, recipe_id: str, user_id: str) -> bool:
    """
    Delete a recipe. Only the creator can delete.
    
    Args:
        db: MongoDB database connection
        recipe_id: Recipe ObjectId as string
        user_id: ID of the user attempting deletion
    
    Returns:
        bool: True if successful
    
    Raises:
        HTTPException: If not authorized, recipe not found, or deletion fails
    """
    try:
        oid = _validate_object_id(recipe_id)

        existing = await db["recipes"].find_one({"_id": oid})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )

        if existing["created_by"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this recipe"
            )

        result = await db["recipes"].delete_one({"_id": oid})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete recipe"
            )
        
        return True
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete recipe"
        )


async def toggle_favorite_recipe(db, recipe_id: str, user_id: str) -> List[str]:
    """
    Add or remove a recipe from user's favorites.
    """
    try:
        # Validate recipe exists
        oid = _validate_object_id(recipe_id)
        recipe = await db["recipes"].find_one({"_id": oid})
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )

        # Get user
        u_oid = ObjectId(user_id) if len(user_id) == 24 else user_id
        user = await db["users"].find_one({"_id": u_oid})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        favorites = user.get("favoriteRecipes", [])
        
        if recipe_id in favorites:
            favorites.remove(recipe_id)
            action = "removed from"
        else:
            favorites.append(recipe_id)
            action = "added to"

        await db["users"].update_one(
            {"_id": u_oid},
            {"$set": {"favoriteRecipes": favorites, "updatedAt": datetime.now(timezone.utc)}}
        )

        logger.info(f"Recipe {recipe_id} {action} favorites for user {user_id}")
        return favorites
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle favorite status"
        )


async def get_favorite_recipes(db, user_id: str) -> List[dict]:
    """
    Get all recipes favorited by the user.
    """
    try:
        u_oid = ObjectId(user_id) if len(user_id) == 24 else user_id
        user = await db["users"].find_one({"_id": u_oid})
        if not user:
            return []

        favorites = user.get("favoriteRecipes", [])
        if not favorites:
            return []

        # Convert string IDs back to ObjectIds for the query
        recipe_oids = []
        for fid in favorites:
            try:
                recipe_oids.append(ObjectId(fid))
            except:
                continue

        cursor = db["recipes"].find({"_id": {"$in": recipe_oids}}).sort("created_at", -1)
        recipes = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            recipes.append(doc)
            
        return recipes
    except Exception as e:
        logger.error(f"Error fetching favorite recipes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch favorite recipes"
        )