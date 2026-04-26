
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import ValidationError

# Adding backend path
sys.path.append(os.path.join(os.getcwd(), 'smartmeal', 'backend'))

from app.schemas.recipe_schema import RecipeResponse
from app.core.config import settings

async def debug_recipes():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB_NAME]
        
        with open("recipe_debug_output.txt", "w", encoding="utf-8") as f:
            f.write(f"Connecting to: {settings.MONGODB_URI}\n")
            f.write(f"DB: {settings.MONGODB_DB_NAME}\n\n")
            
            cursor = db.recipes.find({})
            recipes = await cursor.to_list(length=100)
            f.write(f"Found {len(recipes)} recipes.\n")
            
            for i, recipe in enumerate(recipes):
                recipe_id = str(recipe.get("_id", "unknown"))
                recipe["_id"] = recipe_id
                
                try:
                    RecipeResponse(**recipe)
                    f.write(f"Recipe {i} ({recipe_id}): OK\n")
                except ValidationError as e:
                    f.write(f"Recipe {i} ({recipe_id}): INVALID\n")
                    f.write(f"  Error: {str(e)}\n")
                    # f.write(f"  Content: {str(recipe)}\n") # To avoid too much data if many errors
                except Exception as e:
                    f.write(f"Recipe {i} ({recipe_id}): EXCEPTION: {str(e)}\n")
                    
    except Exception as e:
        print(f"Global script error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_recipes())
