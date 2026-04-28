from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.recommendation import recommendRecipes
from app.services.ai_recipe_generator import generate_ai_recipe, is_ai_available, chat_about_recipe
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


class GenerateRecipeRequest(BaseModel):
    """Structured input for AI recipe generation."""
    ingredients: str                          # comma-separated or space-separated
    diet: Optional[str] = None               # e.g. "veg", "non-veg", "vegan"
    cuisine: Optional[str] = None            # e.g. "Indian", "Italian"
    spice_level: Optional[str] = None        # e.g. "mild", "medium", "hot"
    expiring_ingredients: Optional[List[str]] = None  # items close to expiry
    cooking_time_max: Optional[int] = None   # minutes
    top_n: int = 5

class ChatMessage(BaseModel):
    role: str
    content: str

class RecipeChatRequest(BaseModel):
    messages: List[ChatMessage]
    recipe_context: dict

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


# ─────────────────────────────────────────────────────────────────────────────
# POST /generate-recipe — TF-IDF match + Azure OpenAI generation
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/generate-recipe")
async def generate_recipe(
    body: GenerateRecipeRequest,
    current_user: Optional[UserInDB] = Depends(get_current_user),
):
    """
    Full AI pipeline:
    1. Normalise & combine ingredients string → TF-IDF query
    2. Run TF-IDF cosine similarity to find top N matching recipes
    3. Send matches + user preferences to Azure OpenAI
    4. Return structured response: recommendations + generated_recipe + shopping_list
    """
    # ── Step 1: Build combined query string ──────────────────────────────────
    query_parts = [body.ingredients]
    if body.cuisine:
        query_parts.append(body.cuisine)
    if body.diet:
        query_parts.append(body.diet)
    if body.expiring_ingredients:
        query_parts.extend(body.expiring_ingredients)
    combined_query = " ".join(query_parts)

    # ── Step 2: TF-IDF recommendations ──────────────────────────────────────
    tfidf_results = recommendRecipes(
        user_input=combined_query,
        top_n=body.top_n,
        diet_filter=body.diet,
        cooking_time_max=body.cooking_time_max,
    )

    has_error = tfidf_results and tfidf_results[0].get("error")
    if has_error:
        recommendations = []
        matched_names = []
    else:
        enriched = await enrich_results(tfidf_results, current_user)
        recommendations = enriched
        matched_names = [r["name"] for r in enriched]

    # ── Step 3: Azure OpenAI generation ─────────────────────────────────────
    # Parse ingredient string into a list for the AI prompt
    user_ingredients = [
        i.strip() for i in body.ingredients.replace(",", " ").split() if i.strip()
    ]

    preferences = {
        "diet": body.diet or "",
        "cuisine": body.cuisine or "",
        "spice_level": body.spice_level or "",
        "expiring_ingredients": body.expiring_ingredients or [],
    }

    # Fetch inventory to inform the AI
    user_inventory = []
    if current_user:
        db = get_db()
        cursor = db.inventory_items.find({"userId": str(current_user.id)})
        inv_docs = await cursor.to_list(length=None)
        user_inventory = [
            f"{doc.get('quantity', 1)} {doc.get('unit', '')} {doc.get('name', '')}".strip() 
            for doc in inv_docs
        ]

    generated_recipe = generate_ai_recipe(
        user_ingredients=user_ingredients,
        matched_recipe_names=matched_names,
        user_inventory=user_inventory,
        preferences=preferences,
    )

    # ── Step 4: Return unified response ─────────────────────────────────────
    return {
        "success": True,
        "ai_available": generated_recipe.get("_ai_available", False),
        "recommendations": recommendations,
        "generated_recipe": generated_recipe,
        "shopping_list": generated_recipe.get("shopping_list", []),
        "alternatives": generated_recipe.get("alternatives", []),
    }

@router.post("/chat")
async def chat_recipe(
    body: RecipeChatRequest,
    current_user: Optional[UserInDB] = Depends(get_current_user),
):
    """
    Continue a conversation with the AI chef about the currently generated recipe.
    """
    messages_dict = [{"role": msg.role, "content": msg.content} for msg in body.messages]
    
    reply = chat_about_recipe(
        messages=messages_dict,
        recipe_context=body.recipe_context
    )
    
    return {"success": True, "reply": reply}
