from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from pydantic import BaseModel
from app.db.database import get_db
from app.models.recipe import Category, RecipeCreate, RecipeUpdate, RecipeResponse
from app.models.user import UserInDB
from app.api.deps import get_current_user
import app.services.recipe_service as recipe_service
from app.services.recommendation import get_recipe_recommendations

class RecommendationRequest(BaseModel):
    ingredients: Optional[str] = ""
    cuisine: Optional[str] = ""
    diet: Optional[str] = ""
    course: Optional[str] = ""

router = APIRouter()


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_in: RecipeCreate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """Create a new recipe (authenticated users only)."""
    db = get_db()
    return await recipe_service.create_recipe(db, recipe_in, current_user.id)


@router.post("/recommend", status_code=status.HTTP_200_OK)
async def recommend_recipes_ai(
    request: RecommendationRequest,
) -> Any:
    """
    [MEMBER 2: AI INTEGRATION]
    Uses TF-IDF NLP and Cosine Similarity to compare user preferences 
    against the pre-processed recipe dataset and returns the top 5 matches.
    """
    matches = get_recipe_recommendations(request.dict(), top_k=5)
    return {"recommendations": matches}


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


@router.put("/{recipe_id}", response_model=RecipeResponse, status_code=status.HTTP_200_OK)
async def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    """Update a recipe. Only the creator can update their recipe."""
    db = get_db()
    return await recipe_service.update_recipe(db, recipe_id, recipe_in, current_user.id)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> Response:
    """Delete a recipe. Only the creator can delete their recipe."""
    db = get_db()
    await recipe_service.delete_recipe(db, recipe_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
