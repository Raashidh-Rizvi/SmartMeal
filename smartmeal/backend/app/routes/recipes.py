from typing import Any, List, Optional
<<<<<<< HEAD
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from app.db.database import get_db
from app.models.recipe import Category, RecipeCreate, RecipeUpdate, RecipeResponse
from app.models.user import UserInDB
from app.api.deps import get_current_user
import app.services.recipe_service as recipe_service
=======
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

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

router = APIRouter()


<<<<<<< HEAD
=======
def _format_validation_error(error: dict) -> str:
    """Format a single validation error into a user-friendly message."""
    loc = error.get("loc")
    msg = error.get("msg", "Validation failed")
    
    if loc:
        field_path = ".".join(str(x) for x in loc)
    else:
        field_path = "Unknown field"
    
    if "Value error, " in msg:
        actual_msg = msg.replace("Value error, ", "")
    else:
        actual_msg = msg
    
    return f"{field_path}: {actual_msg}"


# ─── POST / (create) ────────────────────────────────────────────────────────
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_in: RecipeCreate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """Create a new recipe (authenticated users only)."""
<<<<<<< HEAD
    db = get_db()
    return await recipe_service.create_recipe(db, recipe_in, current_user.id)


@router.get("/", response_model=List[RecipeResponse], status_code=status.HTTP_200_OK)
async def list_recipes(
    search: Optional[str] = Query(None, description="Case-insensitive search on title/description"),
    category: Optional[Category] = Query(None, description="Filter by category"),
    created_by: Optional[str] = Query(None, description="Filter by creator user ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
) -> Any:
    """List recipes. Supports search, category filter, and created_by filter."""
    db = get_db()
    return await recipe_service.get_all_recipes(
        db,
        search=search,
        category=category,
        created_by=created_by,
        skip=skip,
        limit=limit,
    )


@router.get("/{recipe_id}", response_model=RecipeResponse, status_code=status.HTTP_200_OK)
async def get_recipe(recipe_id: str) -> Any:
    """Retrieve a single recipe by its ID."""
    db = get_db()
    return await recipe_service.get_recipe_by_id(db, recipe_id)


=======
    try:
        db = get_db()
        return await recipe_service.create_recipe(db, recipe_in, current_user.id)
    except ValidationError as e:
        logger.warning(f"Recipe validation error: {e}")
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


# ─── POST /recommend ─────────────────────────────────────────────────────────
@router.post("/recommend", status_code=status.HTTP_200_OK)
async def recommend_recipes_ai(
    request: RecommendationRequest,
) -> Any:
    """AI recipe recommendations via TF-IDF + cosine similarity."""
    try:
        matches = get_recipe_recommendations(request.model_dump(), top_k=5)
        return {"recommendations": matches, "count": len(matches)}
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


# ─── GET /by-type/{meal_type} ────────────────────────────────────────────────
@router.get("/by-type/{meal_type}")
async def list_recipes_by_type(meal_type: str) -> Any:
    """Get recipes filtered by meal type (breakfast, lunch, dinner, snack)."""
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


# ─── GET / (list all) ────────────────────────────────────────────────────────
@router.get("/", status_code=status.HTTP_200_OK)
async def list_recipes(
    search: Optional[str] = Query(None, max_length=100),
    category: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
) -> Any:
    """List recipes with optional filtering and search."""
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


# ─── GET /debug/test-data ─────────────────────────────────────────────────────
# IMPORTANT: Must be defined BEFORE /{recipe_id} to avoid being captured by it
@router.get("/debug/test-data", status_code=status.HTTP_200_OK)
async def debug_test_data() -> Any:
    """Debug endpoint returning hardcoded data."""
    return [{"id": "1", "title": "Test 1"}, {"id": "2", "title": "Test 2"}]


# ─── GET /user/favorites ──────────────────────────────────────────────────────
# IMPORTANT: Must be defined BEFORE /{recipe_id} to avoid being captured by it
@router.get("/user/favorites", status_code=status.HTTP_200_OK)
async def list_favorite_recipes(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """Get all recipes favorited by the current user."""
    try:
        db = get_db()
        return await recipe_service.get_favorite_recipes(
            db, 
            current_user.id, 
            skip=skip, 
            limit=limit, 
            search=search, 
            category=category
        )
    except Exception as e:
        logger.error(f"Error listing favorite recipes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch favorite recipes"
        )


# ─── GET /{recipe_id} ────────────────────────────────────────────────────────
@router.get("/{recipe_id}", status_code=status.HTTP_200_OK)
async def get_recipe(recipe_id: str) -> Any:
    """Retrieve a single recipe by its ID."""
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


# ─── PUT /{recipe_id} ────────────────────────────────────────────────────────
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
@router.put("/{recipe_id}", response_model=RecipeResponse, status_code=status.HTTP_200_OK)
async def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
<<<<<<< HEAD
    """Update a recipe. Only the creator can update their recipe."""
    db = get_db()
    return await recipe_service.update_recipe(db, recipe_id, recipe_in, current_user.id)


=======
    """Update a recipe. Only the creator can update."""
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


# ─── DELETE /{recipe_id} ─────────────────────────────────────────────────────
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> Response:
<<<<<<< HEAD
    """Delete a recipe. Only the creator can delete their recipe."""
    db = get_db()
    await recipe_service.delete_recipe(db, recipe_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
=======
    """Delete a recipe. Only the creator can delete."""
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


# ─── POST /{recipe_id}/toggle-favorite ───────────────────────────────────────
@router.post("/{recipe_id}/toggle-favorite", status_code=status.HTTP_200_OK)
async def toggle_recipe_favorite(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """Toggle a recipe as favorite for the current user."""
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
