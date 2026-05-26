import os
import re
import random
from pathlib import Path

image_base_path = Path(__file__).resolve().parent.parent / "data" / "image_for _cuisines" / "data"
all_images = []
if image_base_path.exists():
    try:
        all_images = [f for f in os.listdir(image_base_path) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
    except Exception:
        pass

def get_cuisine_image(recipe_name: str) -> str | None:
    if not all_images or not recipe_name:
        return None
        
    # Clean the recipe name to extract meaningful keywords
    clean_name = re.sub(r'[^a-zA-Z\s]', ' ', recipe_name)
    query_lower = clean_name.lower()
    
    # Common words to ignore that pollute matching
    ignore_words = {'recipe', 'style', 'with', 'in', 'and', 'the', 'of', 'a', 'an', 'for', 'to'}
    keywords = [kw for kw in query_lower.split() if kw not in ignore_words and len(kw) > 2]
    
    if not keywords:
        return f"/api/images/cuisine-images/{random.choice(all_images)}"
        
    scored_images = []
    
    # Extract the core name without brackets or "recipe" for exact substring matching
    core_name = recipe_name.lower().split(' (')[0].replace(" recipe", "").strip()
    core_name_clean = re.sub(r'[^a-z\s]', ' ', core_name)
    
    for img in all_images:
        # Clean image name (remove numbers, extension, underscores)
        clean_img = re.sub(r'[\d\.\-_]', ' ', img).lower()
        
        matches = sum(1 for kw in keywords if kw in clean_img)
        
        if matches > 0:
            # Add a massive boost if the core recipe name is a direct substring of the image name
            exact_boost = 10 if core_name_clean and core_name_clean in clean_img else 0
            scored_images.append((img, matches + exact_boost))
            
    if scored_images:
        scored_images.sort(key=lambda x: x[1], reverse=True)
        best_match = scored_images[0]
        return f"/api/images/cuisine-images/{best_match[0]}"
    elif all_images:
        return f"/api/images/cuisine-images/{random.choice(all_images)}"
    return None
