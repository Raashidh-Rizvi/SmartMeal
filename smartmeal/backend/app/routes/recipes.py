from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, ValidationError
from app.db.database import get_db
from app.models.recipe import Category, RecipeCreate, RecipeUpdate, RecipeResponse, RecipeResponseRaw
from app.models.user import UserInDB
from app.api.deps import get_current_user
import app.services.recipe_service as recipe_service
from app.services.recommendation import get_recipe_recommendations
import logging

logger = logging.getLogger(__name__)


class RecommendationRequest(BaseModel):
    ingredients: Optional[str] = ""
    cuisine: Optional[str] = ""
    diet: Optional[str] = ""
    course: Optional[str] = ""


router = APIRouter()


def _format_validation_error(error: dict) -> str:
    """Format a single validation error into a user-friendly message."""
    loc = error.get("loc")
    msg = error.get("msg", "Validation failed")
    
    # Build field path (e.g., "ingredients[0].unit")
    if loc:
        field_path = ".".join(str(x) for x in loc)
    else:
        field_path = "Unknown field"
    
    # Extract the actual error message (may be wrapped in "Value error, ")
    if "Value error, " in msg:
        actual_msg = msg.replace("Value error, ", "")
    else:
        actual_msg = msg
    
    return f"{field_path}: {actual_msg}"


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_in: RecipeCreate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """
    Create a new recipe (authenticated users only).
    
    **Validation:**
    - Title: 3-200 characters
    - Description: Max 2000 characters
    - At least 1 ingredient (max 100)
    - At least 1 preparation step (max 50 steps)
    - Cooking time: 1-1440 minutes
    - Valid dietary tags from predefined list
    - Image URL must be http/https
    
    **Returns:** Created recipe with ID
    """
    try:
        db = get_db()
        return await recipe_service.create_recipe(db, recipe_in, current_user.id)
    except ValidationError as e:
        logger.warning(f"Recipe validation error: {e}")
        # Format first error for user-friendly display
        errors = e.errors()
        formatted_msg = _format_validation_error(errors[0]) if errors else "Validation failed"
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=formatted_msg
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create recipe"
        )


@router.post("/recommend", status_code=status.HTTP_200_OK)
async def recommend_recipes_ai(
    request: RecommendationRequest,
) -> Any:
    """
    [MEMBER 2: AI INTEGRATION]
    Uses TF-IDF NLP and Cosine Similarity to compare user preferences
    against the pre-processed recipe dataset and returns the top 5 matches.
    
    **Parameters:**
    - ingredients: Comma-separated ingredient names
    - cuisine: Cuisine type preference
    - diet: Dietary preference
    - course: Meal course (breakfast, lunch, dinner, snack)
    
    **Returns:** List of recommended recipes with similarity scores
    """
    try:
        matches = get_recipe_recommendations(request.model_dump(), top_k=5)
        return {"recommendations": matches, "count": len(matches)}
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


@router.get("/by-type/{meal_type}")
async def list_recipes_by_type(meal_type: str) -> Any:
    """
    Get recipes filtered by meal type/category.
    Used by meal schedule UI.
    
    **Parameters:**
    - meal_type: breakfast, lunch, dinner, or snack
    
    **Returns:** List of recipes for the specified meal type
    """
    try:
        db = get_db()
        return await recipe_service.get_recipes_by_meal_type(db, meal_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipes by meal type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recipes"
        )


@router.get("/", status_code=status.HTTP_200_OK)
async def list_recipes(
    search: Optional[str] = Query(None, max_length=100),
    category: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """
    List recipes with optional filtering and search.
    
    **Parameters:**
    - search: Search term for recipe titles/descriptions (max 100 chars)
    - category: Filter by meal type (breakfast, lunch, dinner, snack)
    - created_by: Filter by creator user ID
    - skip: Pagination offset (default 0)
    - limit: Results per page (1-100, default 20)
    
    **Returns:** List of recipe dictionaries
    """
    try:
        if search and len(search) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search term cannot exceed 100 characters"
            )
        
        db = get_db()
        result = await recipe_service.get_all_recipes(
            db,
            search=search,
            category=category,
            created_by=created_by,
            skip=skip,
            limit=limit,
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing recipes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recipes"
        )


@router.get("/{recipe_id}", status_code=status.HTTP_200_OK)
async def get_recipe(recipe_id: str) -> Any:
    """
    Retrieve a single recipe by its ID.
    
    **Parameters:**
    - recipe_id: MongoDB ObjectId (24-character hex string)
    
    **Returns:** RecipeResponse with full recipe details
    """
    try:
        db = get_db()
        return await recipe_service.get_recipe_by_id(db, recipe_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recipe"
        )


@router.put("/{recipe_id}", response_model=RecipeResponse, status_code=status.HTTP_200_OK)
async def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """
    Update a recipe. Only the creator can update.
    
    **Parameters:**
    - recipe_id: MongoDB ObjectId
    - recipe_in: RecipeUpdate with fields to update (all optional)
    
    **Returns:** Updated RecipeResponse
    
    **Errors:**
    - 403: If you're not the recipe creator
    - 404: If recipe not found
    - 422: If validation fails
    """
    try:
        db = get_db()
        return await recipe_service.update_recipe(db, recipe_id, recipe_in, current_user.id)
    except ValidationError as e:
        logger.warning(f"Recipe update validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid recipe data"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update recipe"
        )


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> Response:
    """
    Delete a recipe. Only the creator can delete.
    
    **Parameters:**
    - recipe_id: MongoDB ObjectId
    
    **Returns:** 204 No Content on success
    
    **Errors:**
    - 403: If you're not the recipe creator
    - 404: If recipe not found
    """
    try:
        db = get_db()
        await recipe_service.delete_recipe(db, recipe_id, current_user.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete recipe"
        )


@router.get("/debug/test-data", status_code=status.HTTP_200_OK)
async def debug_test_data() -> Any:
    """Debug endpoint returning hardcoded data."""
    return [{"id": "1", "title": "Test 1"}, {"id": "2", "title": "Test 2"}]


@router.post("/{recipe_id}/toggle-favorite", status_code=status.HTTP_200_OK)
async def toggle_recipe_favorite(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """
    Toggle a recipe as favorite for the current user.
    """
    try:
        db = get_db()
        favorites = await recipe_service.toggle_favorite_recipe(db, recipe_id, current_user.id)
        return {"favorites": favorites}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling recipe favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle favorite"
        )


@router.get("/user/favorites", status_code=status.HTTP_200_OK)
async def list_favorite_recipes(
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """
    Get all recipes favorited by the current user.
    """
    try:
        db = get_db()
        return await recipe_service.get_favorite_recipes(db, current_user.id)
    except Exception as e:
        logger.error(f"Error listing favorite recipes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch favorite recipes"
        )
