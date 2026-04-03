"""
Member 5: Leftover AI — Reuse Ideas
Connects leftover ingredients to the existing TF-IDF recommendation engine,
re-ranks results, and generates explanations.
"""
import logging
import re
from typing import List, Dict, Any

from app.services.recommendation import get_recipe_recommendations
from app.services.output_service import filter_recipes, format_output, limit_results

logger = logging.getLogger(__name__)

# ── Filler words to strip before passing to TF-IDF ──────────────────────────
_FILLER = {
    'the','a','an','and','or','with','in','of','to','for','some','few',
    'fried','baked','grilled','boiled','roasted','steamed','cooked',
    'raw','fresh','dried','sliced','chopped','minced','crushed',
    'hot','cold','spicy','sweet','salty','warm','whole','half',
    'piece','cup','bowl','plate','serving','tablespoon','teaspoon',
    'large','small','medium','big','little'
}

# ── Rule-based quick suggestions ─────────────────────────────────────────────
_RULES = {
    'rice':    'Fried Rice',
    'bread':   'Sandwich',
    'chicken': 'Chicken Wraps',
    'egg':     'Omelette',
    'pasta':   'Pasta Stir-fry',
    'potato':  'Potato Curry',
    'tomato':  'Tomato Soup',
    'onion':   'Onion Pakoda',
}


# ── 1. combineIngredients ─────────────────────────────────────────────────────
def combineIngredients(leftovers: List[Dict[str, Any]]) -> List[str]:
    """
    Merge ingredients from all selected leftovers,
    clean them, and remove duplicates.
    Input:  [{"name": "Curry", "ingredients": ["chicken", "rice", "onion"]}, ...]
    Output: ["chicken", "rice", "onion", ...]
    """
    seen = set()
    combined = []

    for leftover in leftovers:
        raw = leftover.get('ingredients') or []
        # Support both list and comma-separated string
        if isinstance(raw, str):
            raw = [i.strip() for i in raw.split(',')]

        for item in raw:
            # Clean: lowercase, remove symbols, split words, drop fillers
            cleaned_words = _clean_ingredient(item)
            for word in cleaned_words:
                if word and word not in seen:
                    seen.add(word)
                    combined.append(word)

    logger.info(f"[LeftoverAI] Combined ingredients: {combined}")
    return combined


def _clean_ingredient(text: str) -> List[str]:
    if not text:
        return []
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', ' ', text)
    words = text.split()
    return [w for w in words if w not in _FILLER and len(w) > 1]


# ── 2. getRecommendations ─────────────────────────────────────────────────────
def getRecommendations(combined_ingredients: List[str], preferences: Dict[str, Any] = None) -> List[Dict]:
    """
    Pass combined ingredients into the existing TF-IDF engine (Member 2).
    """
    if not combined_ingredients:
        logger.warning("[LeftoverAI] No ingredients to query.")
        return []

    ingredient_string = ' '.join(combined_ingredients)
    logger.info(f"[LeftoverAI] Querying recommendation engine with: {ingredient_string}")

    user_input = {'ingredients': ingredient_string}
    if preferences:
        user_input.update(preferences)

    # Call Member 2's TF-IDF engine
    results = get_recipe_recommendations(user_input, top_k=15)
    return results


# ── 3. rankRecipes ────────────────────────────────────────────────────────────
def rankRecipes(recipes: List[Dict], combined_ingredients: List[str]) -> List[Dict]:
    """
    Re-rank recipes by:
    1. Number of leftover ingredients matched (higher = better)
    2. Similarity score from TF-IDF (tiebreaker)
    3. Shorter prep_time (bonus)
    """
    ingredient_set = set(combined_ingredients)

    for recipe in recipes:
        recipe_ingredients = str(recipe.get('ingredients', '') or recipe.get('ingredients_clean', ''))
        recipe_words = set(recipe_ingredients.lower().split())

        # Count how many leftover ingredients appear in this recipe
        matched = ingredient_set & recipe_words
        recipe['_matched_count'] = len(matched)
        recipe['_matched_ingredients'] = list(matched)

        # Prep time bonus: shorter time = higher boost
        prep_time = recipe.get('prep_time', '') or ''
        time_boost = 0
        time_match = re.search(r'(\d+)', str(prep_time))
        if time_match:
            minutes = int(time_match.group(1))
            if minutes <= 20:
                time_boost = 0.15
            elif minutes <= 40:
                time_boost = 0.08

        similarity = float(recipe.get('similarity_score', 0) or 0)
        recipe['_final_score'] = similarity + (recipe['_matched_count'] * 0.1) + time_boost

    ranked = sorted(recipes, key=lambda r: r['_final_score'], reverse=True)
    logger.info(f"[LeftoverAI] Top ranked: {[r.get('name','?') for r in ranked[:5]]}")
    return ranked


# ── 4. generateExplanation ────────────────────────────────────────────────────
def generateExplanation(recipe: Dict, combined_ingredients: List[str]) -> str:
    """
    "Recommended because it uses [x, y] from your leftovers"
    """
    matched = recipe.get('_matched_ingredients', [])
    score = recipe.get('similarity_score', 0) or 0

    if matched:
        ing_str = ', '.join(matched[:5])
        return f"Recommended because it uses {ing_str} from your leftovers (match score: {float(score):.2f})"
    return f"Recommended based on your leftover ingredients (similarity: {float(score):.2f})"


# ── 5. getRuleBasedSuggestions ────────────────────────────────────────────────
def getRuleBasedSuggestions(combined_ingredients: List[str]) -> List[str]:
    """
    Simple rule-based quick suggestions based on key ingredients.
    """
    suggestions = []
    for ingredient in combined_ingredients:
        if ingredient in _RULES and _RULES[ingredient] not in suggestions:
            suggestions.append(_RULES[ingredient])
    return suggestions[:3]


# ── 6. Main entry point ───────────────────────────────────────────────────────
def generateLeftoverRecipes(
    leftovers: List[Dict[str, Any]],
    preferences: Dict[str, Any] = None,
    top_n: int = 5
) -> Dict[str, Any]:
    """
    Full pipeline:
    1. Combine & clean ingredients
    2. Get TF-IDF recommendations
    3. Re-rank
    4. Generate explanations
    5. Return top N with rule-based suggestions
    """
    # Validate input
    valid_leftovers = [l for l in leftovers if l.get('ingredients')]
    if not valid_leftovers:
        return {
            'success': False,
            'message': 'No matching recipes found. Try different ingredients.',
            'recipes': [],
            'combined_ingredients': [],
            'rule_based_suggestions': []
        }

    # Step 1: Combine ingredients
    combined = combineIngredients(valid_leftovers)
    logger.info(f"[LeftoverAI] Step 1 - Combined: {combined}")

    if not combined:
        return {
            'success': False,
            'message': 'No valid ingredients found. Please add ingredients to your leftovers.',
            'recipes': [],
            'combined_ingredients': [],
            'rule_based_suggestions': []
        }

    # Step 2: Get recommendations from TF-IDF engine
    raw_recipes = getRecommendations(combined, preferences)
    logger.info(f"[LeftoverAI] Step 2 - Got {len(raw_recipes)} raw results")

    if not raw_recipes:
        return {
            'success': False,
            'message': 'No matching recipes found. Try different ingredients.',
            'recipes': [],
            'combined_ingredients': combined,
            'rule_based_suggestions': getRuleBasedSuggestions(combined)
        }

    # Step 3: Re-rank
    ranked = rankRecipes(raw_recipes, combined)

    # Step 4: Take top N
    top = ranked[:top_n]

    # Step 5: Format with explanations
    results = []
    for recipe in top:
        ingredients_raw = recipe.get('ingredients', '')
        ingredients_list = [i.strip() for i in str(ingredients_raw).split(',') if i.strip()]

        results.append({
            'name': recipe.get('name', 'Unknown Recipe'),
            'ingredients': ingredients_list,
            'cuisine': recipe.get('cuisine', 'N/A'),
            'diet': recipe.get('diet', 'N/A'),
            'prep_time': recipe.get('prep_time', 'N/A'),
            'instructions': recipe.get('instructions', ''),
            'matched_ingredients': recipe.get('_matched_ingredients', []),
            'match_count': recipe.get('_matched_count', 0),
            'similarity_score': round(float(recipe.get('similarity_score', 0) or 0), 3),
            'explanation': generateExplanation(recipe, combined)
        })

    # Step 6: Rule-based suggestions
    rule_suggestions = getRuleBasedSuggestions(combined)

    logger.info(f"[LeftoverAI] Final results: {[r['name'] for r in results]}")

    return {
        'success': True,
        'message': f'Found {len(results)} recipe suggestions for your leftovers!',
        'combined_ingredients': combined,
        'selected_leftovers': [l.get('name', '') for l in valid_leftovers],
        'recipes': results,
        'rule_based_suggestions': rule_suggestions
    }
