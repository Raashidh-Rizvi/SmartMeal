from typing import List, Dict, Any

def filter_recipes(recipes: List[Dict[str, Any]], preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Filter recipes based on user preferences: diet, cooking time, allergies
    """
    filtered = []
    
    for recipe in recipes:
        # Diet filter (veg/non-veg)
        diet = preferences.get('diet')
        if diet and recipe.get('diet') != diet:
            continue
        
        # Allergy/Exclude ingredient filter
        exclude = preferences.get('exclude_ingredient')
        if exclude and exclude.lower() in str(recipe.get('ingredients', '')).lower():
            continue
        
        # Cooking time filter (assume max minutes)
        cooking_time = recipe.get('estimated_cooking_time') or recipe.get('cooking_time', 999)
        max_time = preferences.get('cooking_time_max', 999)
        if cooking_time and cooking_time > max_time:
            continue
        
        filtered.append(recipe)
    
    return filtered

def generate_explanation(recipe: Dict[str, Any], user_ingredients: str = '') -> str:
    """
    Generate recommendation explanation
    """
    score = recipe.get('similarity_score', 0)
    return f"This recipe is recommended because it matches your ingredients '{user_ingredients}' with similarity score {score:.2f}."

def format_output(recipes: List[Dict[str, Any]], user_ingredients: str = '') -> List[Dict[str, Any]]:
    """
    Format recipes into clean output: name, ingredients, cuisine, cooking time, explanation
    """
    formatted = []
    
    for recipe in recipes:
        # Split ingredients string to list for better frontend display
        ingredients_str = recipe.get('ingredients', '')
        ingredients_list = [ing.strip() for ing in ingredients_str.split(',') if ing.strip()]
        
        formatted.append({
            'name': recipe.get('name', 'Unknown Recipe'),
            'ingredients': ingredients_list,
            'cuisine': recipe.get('cuisine', 'Unknown'),
            'cooking_time': recipe.get('estimated_cooking_time', recipe.get('cooking_time', 'N/A')),
            'explanation': generate_explanation(recipe, user_ingredients)
        })
    
    return formatted

def limit_results(recipes: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
    """
    Limit number of results to avoid overload
    """
    return recipes[:limit]

