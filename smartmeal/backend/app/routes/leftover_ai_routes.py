"""
Member 5: Leftover AI Route
POST /api/leftovers/generate-recipes
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from pydantic import BaseModel
import logging

from app.services.leftover_ai import generateLeftoverRecipes

router = APIRouter(prefix="/api/leftovers", tags=["leftover-ai"])
logger = logging.getLogger(__name__)


class LeftoverItem(BaseModel):
    id: str = ""
    name: str
    ingredients: List[str] = []


class GenerateRecipesRequest(BaseModel):
    leftovers: List[LeftoverItem]
    preferences: Dict[str, Any] = {}
    top_n: int = 5


@router.post("/generate-recipes")
async def generate_recipes_from_leftovers(request: GenerateRecipesRequest):
    """
    Member 5: Leftover AI endpoint.
    Accepts selected leftovers, combines ingredients,
    runs TF-IDF recommendation + re-ranking, returns top recipes.
    """
    logger.info(f"[LeftoverAI] Received {len(request.leftovers)} leftovers")

    if not request.leftovers:
        return {
            'success': False,
            'message': 'Please select at least one leftover item.',
            'recipes': [],
            'combined_ingredients': [],
            'rule_based_suggestions': []
        }

    leftovers_data = [l.model_dump() for l in request.leftovers]
    result = generateLeftoverRecipes(
        leftovers=leftovers_data,
        preferences=request.preferences,
        top_n=request.top_n
    )
    return result
