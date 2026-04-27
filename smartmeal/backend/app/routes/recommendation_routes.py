from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.recommendation import recommendRecipes
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import UserInDB
from jose import JWTError, jwt
from app.core.config import settings

router = APIRouter(tags=["recommendations"])

class SearchRequest(BaseModel):
    query: str
    top_n: int = 5
    diet: Optional[str] = None
    cooking_time_max: Optional[int] = None

async def get_optional_user(token: Optional[str] = Query(None)) -> Optional[UserInDB]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email: return None
        db = get_db()
        user_dict = await db["users"].find_one({"email": email})
        if not user_dict: return None
        user_dict["_id"] = str(user_dict["_id"])
        return UserInDB(**user_dict)
    except:
        return None

async def enrich_results(results: List[dict], user: Optional[UserInDB] = None):
    if not results or (results and results[0].get("error")):
        return results
    
    db = get_db()
    for r in results:
        # Search for recipe in DB by exact title
        matched = await db["recipes"].find_one({"title": {"$regex": f"^{r['name']}$", "$options": "i"}})
        if matched:
            r["_id"] = str(matched["_id"])
            if user and r["_id"] in user.favoriteRecipes:
                r["is_favorited"] = True
            else:
                r["is_favorited"] = False
        else:
            r["_id"] = None
            r["is_favorited"] = False
    return results

@router.post("/search")
async def search_recipes(
    body: SearchRequest,
    # Try to get user from Authorization header if present
    current_user: Optional[UserInDB] = Depends(get_current_user),
):
    results = recommendRecipes(
        user_input=body.query,
        top_n=body.top_n,
        diet_filter=body.diet,
        cooking_time_max=body.cooking_time_max,
    )
    
    if results and results[0].get("error"):
        return {"success": False, "message": results[0]["message"], "recipes": []}
        
    enriched = await enrich_results(results, current_user)
    return {"success": True, "recipes": enriched}

@router.get("/search")
async def search_recipes_get(
    q: str = Query(..., description="Free-text query, e.g. 'chicken rice spicy'"),
    top_n: int = Query(5, ge=1, le=20),
    diet: Optional[str] = Query(None),
    cooking_time_max: Optional[int] = Query(None),
    current_user: Optional[UserInDB] = Depends(get_current_user),
):
    results = recommendRecipes(
        user_input=q,
        top_n=top_n,
        diet_filter=diet,
        cooking_time_max=cooking_time_max,
    )
    if results and results[0].get("error"):
        return {"success": False, "message": results[0]["message"], "recipes": []}
    
    enriched = await enrich_results(results, current_user)
    return {"success": True, "recipes": enriched}
