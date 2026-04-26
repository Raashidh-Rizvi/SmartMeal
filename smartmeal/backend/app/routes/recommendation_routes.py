"""
/api/recommendations  — AI-powered recipe search endpoint
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from app.services.recommendation import recommendRecipes

router = APIRouter(tags=["recommendations"])


class SearchRequest(BaseModel):
    query: str
    top_n: int = 5
    diet: Optional[str] = None          # "veg" | "non-veg"
    cooking_time_max: Optional[int] = None


@router.post("/search")
def search_recipes(body: SearchRequest):
    """
    AI recipe search using TF-IDF + cosine similarity.

    Body example:
        { "query": "chicken rice spicy", "top_n": 5, "diet": "non-veg" }
    """
    results = recommendRecipes(
        user_input=body.query,
        top_n=body.top_n,
        diet_filter=body.diet,
        cooking_time_max=body.cooking_time_max,
    )
    # Surface error messages cleanly
    if results and results[0].get("error"):
        return {"success": False, "message": results[0]["message"], "recipes": []}
    return {"success": True, "recipes": results}


@router.get("/search")
def search_recipes_get(
    q: str = Query(..., description="Free-text query, e.g. 'chicken rice spicy'"),
    top_n: int = Query(5, ge=1, le=20),
    diet: Optional[str] = Query(None),
    cooking_time_max: Optional[int] = Query(None),
):
    """GET variant — useful for direct URL testing."""
    results = recommendRecipes(
        user_input=q,
        top_n=top_n,
        diet_filter=diet,
        cooking_time_max=cooking_time_max,
    )
    if results and results[0].get("error"):
        return {"success": False, "message": results[0]["message"], "recipes": []}
    return {"success": True, "recipes": results}
