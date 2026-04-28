"""
AI Recipe Generator
====================
Calls Azure OpenAI (GPT-4o) to generate a complete, structured recipe
based on user ingredients and the top TF-IDF matched recipe names.

Public API
----------
generate_ai_recipe(user_ingredients, matched_recipe_names, preferences) -> dict
is_ai_available() -> bool
"""

import json
import logging
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


# ── Lazy import of Azure OpenAI client so the app still starts without it ─────
def _get_client():
    from app.core.config import settings
    if not settings.AZURE_OPENAI_KEY or not settings.AZURE_OPENAI_ENDPOINT:
        return None, None, None
    try:
        from openai import AzureOpenAI

        # Normalise the endpoint: Azure AI Foundry gives a full path like
        # https://<resource>.services.ai.azure.com/api/projects/.../openai/v1/responses
        # The AzureOpenAI SDK only wants the base URL (scheme + host).
        endpoint = settings.AZURE_OPENAI_ENDPOINT.rstrip("/")
        # Strip any path after the hostname so the SDK can build its own paths
        from urllib.parse import urlparse
        parsed = urlparse(endpoint)
        base_endpoint = f"{parsed.scheme}://{parsed.netloc}"

        client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=base_endpoint,
        )
        return client, settings.AZURE_OPENAI_DEPLOYMENT, None
    except Exception as e:
        logger.warning(f"[AIRecipe] Could not initialise Azure OpenAI client: {e}")
        return None, None, str(e)


def is_ai_available() -> bool:
    client, _, _ = _get_client()
    return client is not None


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builder
# ─────────────────────────────────────────────────────────────────────────────
def _build_prompt(
    user_ingredients: List[str],
    matched_recipe_names: List[str],
    user_inventory: List[str],
    preferences: Dict[str, Any],
) -> str:
    ing_str = ", ".join(user_ingredients) if user_ingredients else "assorted ingredients"
    inv_str = "\n".join(f"  - {i}" for i in user_inventory) if user_inventory else "  (no inventory data)"
    context_str = "\n".join(f"  - {n}" for n in matched_recipe_names[:5]) if matched_recipe_names else "  (no prior matches)"

    diet = preferences.get("diet", "")
    cuisine = preferences.get("cuisine", "")
    spice = preferences.get("spice_level", "")
    expiring = preferences.get("expiring_ingredients", [])

    diet_line = f"Dietary preference: {diet}" if diet else ""
    cuisine_line = f"Preferred cuisine: {cuisine}" if cuisine else ""
    spice_line = f"Spice level: {spice}" if spice else ""
    expiry_line = (
        f"PRIORITY — use these expiring ingredients first: {', '.join(expiring)}"
        if expiring else ""
    )

    pref_block = "\n".join(filter(None, [diet_line, cuisine_line, spice_line, expiry_line]))
    if not pref_block:
        pref_block = "No special preferences."
    return f"""You are a professional chef AI integrated into a smart recipe management application.

USER'S CURRENT SEARCH / SELECTED INGREDIENTS:
{ing_str}

USER'S FULL INVENTORY (What they already have in their pantry):
{inv_str}

SIMILAR RECIPES FROM DATABASE (use as inspiration, not copy):
{context_str}

USER PREFERENCES:
{pref_block}

YOUR TASK:
Generate ONE complete, original recipe using the available ingredients as much as possible.
Return ONLY a valid JSON object — no markdown, no extra text, no code fences.

JSON SCHEMA (follow exactly):
{{
  "recipe_name": "string",
  "cuisine": "string",
  "diet": "string (e.g. Vegetarian, Non-Vegetarian, Vegan)",
  "prep_time": "string (e.g. 30 minutes)",
  "servings": "string (e.g. 4 servings)",
  "ingredients": [
    {{"item": "string", "quantity": "string", "available": true}}
  ],
  "missing_ingredients": ["string"],
  "instructions": ["step 1 text", "step 2 text"],
  "tips": "string (1-2 chef tips)",
  "shopping_list": ["string"],
  "alternatives": [
    {{"name": "string", "reason": "string"}},
    {{"name": "string", "reason": "string"}}
  ]
}}

RULES:
- Cross-reference the required ingredients with the USER'S FULL INVENTORY.
- Mark each ingredient "available": true if it is in the USER'S FULL INVENTORY or USER'S CURRENT SEARCH.
- Mark "available": false only if the user does NOT have it in their inventory/search.
- missing_ingredients = ingredients with "available": false.
- shopping_list = same as missing_ingredients but formatted as a clean shopping list item (quantity + item).
- Provide exactly 2 alternatives in the alternatives array.
- Keep instructions concise (6-10 steps).
- Do NOT include any text outside the JSON object.
"""


# ─────────────────────────────────────────────────────────────────────────────
# Response parser — handles imperfect JSON from the model
# ─────────────────────────────────────────────────────────────────────────────
def _parse_response(raw_text: str) -> Dict[str, Any]:
    """Extract and parse JSON from model response. Returns fallback dict on failure."""
    # Strip markdown fences if the model disobeyed instructions
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?", "", text, flags=re.MULTILINE)
    text = re.sub(r"```$", "", text, flags=re.MULTILINE)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract the first JSON object via regex
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

    logger.warning("[AIRecipe] Could not parse model response as JSON, returning raw text.")
    return {
        "recipe_name": "AI Generated Recipe",
        "cuisine": "",
        "diet": "",
        "prep_time": "",
        "servings": "",
        "ingredients": [],
        "missing_ingredients": [],
        "instructions": [raw_text],
        "tips": "",
        "shopping_list": [],
        "alternatives": [],
        "_parse_error": True,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Fallback when Azure credentials are absent / call fails
# ─────────────────────────────────────────────────────────────────────────────
def _fallback_response(
    user_ingredients: List[str],
    matched_recipe_names: List[str],
    reason: str = "Azure OpenAI is not configured.",
) -> Dict[str, Any]:
    return {
        "recipe_name": matched_recipe_names[0] if matched_recipe_names else "Ingredient Mix",
        "cuisine": "Various",
        "diet": "—",
        "prep_time": "30 minutes",
        "servings": "2 servings",
        "ingredients": [{"item": i, "quantity": "as needed", "available": True} for i in user_ingredients],
        "missing_ingredients": [],
        "instructions": [
            "Combine your available ingredients.",
            "Cook over medium heat until done.",
            "Season to taste and serve.",
        ],
        "tips": "Try one of the recommended recipes above for a more detailed guide.",
        "shopping_list": [],
        "alternatives": [
            {"name": name, "reason": "Matched from your ingredients"}
            for name in matched_recipe_names[1:3]
        ],
        "_ai_available": False,
        "_reason": reason,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main public function
# ─────────────────────────────────────────────────────────────────────────────
def generate_ai_recipe(
    user_ingredients: List[str],
    matched_recipe_names: List[str],
    user_inventory: List[str] = None,
    preferences: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate a complete AI recipe using Azure OpenAI.

    Parameters
    ----------
    user_ingredients    : list of ingredient strings
    matched_recipe_names: top recipe names from TF-IDF engine (context)
    user_inventory      : list of user's inventory items
    preferences         : dict with optional keys — diet, cuisine, spice_level, expiring_ingredients

    Returns
    -------
    Structured dict with: recipe_name, ingredients, missing_ingredients,
    instructions, shopping_list, alternatives, tips, etc.
    """
    if preferences is None:
        preferences = {}

    client, deployment, init_error = _get_client()
    if client is None:
        reason = init_error or "AZURE_OPENAI_KEY / AZURE_OPENAI_ENDPOINT not set in .env"
        logger.warning(f"[AIRecipe] Falling back — {reason}")
        return _fallback_response(user_ingredients, matched_recipe_names, reason)

    if user_inventory is None:
        user_inventory = []

    prompt = _build_prompt(user_ingredients, matched_recipe_names, user_inventory, preferences)
    logger.info(f"[AIRecipe] Calling Azure OpenAI deployment={deployment}")

    try:
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional chef AI. Always respond with valid JSON only. "
                        "No markdown, no preamble, no explanation outside the JSON object."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1800,
        )
        raw = response.choices[0].message.content or ""
        logger.info(f"[AIRecipe] Received response ({len(raw)} chars)")
        result = _parse_response(raw)
        result["_ai_available"] = True
        return result

    except Exception as e:
        logger.error(f"[AIRecipe] Azure OpenAI call failed: {e}", exc_info=True)
        return _fallback_response(
            user_ingredients,
            matched_recipe_names,
            reason=f"Azure OpenAI call failed: {str(e)}",
        )


# ─────────────────────────────────────────────────────────────────────────────
# Chat capabilities
# ─────────────────────────────────────────────────────────────────────────────
def chat_about_recipe(messages: List[Dict[str, str]], recipe_context: Dict[str, Any]) -> str:
    """
    Continue a conversation about a generated recipe.
    """
    client, deployment, init_error = _get_client()
    if client is None:
        return "I'm sorry, my AI features are currently offline."

    # Build system prompt with recipe context
    recipe_name = recipe_context.get("recipe_name", "the recipe")
    ingredients = recipe_context.get("ingredients", [])
    instructions = recipe_context.get("instructions", [])
    
    ing_str = ", ".join([i.get("item", "") for i in ingredients if isinstance(i, dict)])
    inst_str = "\n".join([f"- {step}" for step in instructions])

    system_prompt = f"""You are a helpful, professional chef AI assistant.
The user is currently viewing a recipe you generated called "{recipe_name}".

RECIPE CONTEXT:
Ingredients: {ing_str}
Instructions:
{inst_str}

Answer the user's questions about this recipe, suggest substitutions, or explain cooking techniques.
Keep your answers concise, friendly, and helpful. 
CRITICAL RULE: Return PLAIN TEXT ONLY. DO NOT use any markdown formatting. No asterisks (*), no hashes (#), no dashes (-) for lists, no backticks. Just use regular paragraphs and punctuation.
"""

    api_messages = [{"role": "system", "content": system_prompt}]
    
    # Append user's conversation history
    for msg in messages:
        role = msg.get("role", "user")
        if role not in ["user", "assistant"]:
            role = "user"
        api_messages.append({"role": role, "content": msg.get("content", "")})

    try:
        response = client.chat.completions.create(
            model=deployment,
            messages=api_messages,
            temperature=0.7,
            max_tokens=800,
        )
        return response.choices[0].message.content or "I'm not sure how to answer that."
    except Exception as e:
        logger.error(f"[AIRecipe] Chat completion failed: {e}", exc_info=True)
        return "I'm sorry, I encountered an error while trying to think of a response."

