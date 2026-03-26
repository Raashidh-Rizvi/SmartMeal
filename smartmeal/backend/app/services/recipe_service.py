from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from ..models.recipe import RecipeCreate, RecipeUpdate, RecipeResponse


def _validate_object_id(recipe_id: str) -> ObjectId:
    """Validate and return ObjectId or raise 422."""
    try:
        return ObjectId(recipe_id)
    except (InvalidId, Exception):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid recipe ID format: '{recipe_id}'"
        )


def _serialize(doc: dict) -> dict:
    """Convert MongoDB document _id to string for response."""
    doc["_id"] = str(doc["_id"])
    return doc


async def create_recipe(db, data: RecipeCreate, user_id: str) -> RecipeResponse:
    now = datetime.now(timezone.utc)
    recipe_dict = data.model_dump()
    # Serialize nested Ingredient objects
    recipe_dict["ingredients"] = [ing.model_dump() for ing in data.ingredients]
    recipe_dict["created_by"] = user_id
    recipe_dict["created_at"] = now
    recipe_dict["updated_at"] = now

    result = await db["recipes"].insert_one(recipe_dict)
    created = await db["recipes"].find_one({"_id": result.inserted_id})
    return RecipeResponse(**_serialize(created))


async def get_all_recipes(
    db,
    search: Optional[str] = None,
    category: Optional[str] = None,
    created_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[RecipeResponse]:
    query: dict = {}

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    if category:
        query["category"] = category

    if created_by:
        query["created_by"] = created_by

    cursor = db["recipes"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    recipes = []
    async for doc in cursor:
        recipes.append(RecipeResponse(**_serialize(doc)))
    return recipes


async def get_recipe_by_id(db, recipe_id: str) -> RecipeResponse:
    oid = _validate_object_id(recipe_id)
    doc = await db["recipes"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID '{recipe_id}' not found."
        )
    return RecipeResponse(**_serialize(doc))


async def update_recipe(
    db, recipe_id: str, data: RecipeUpdate, user_id: str
) -> RecipeResponse:
    oid = _validate_object_id(recipe_id)

    existing = await db["recipes"].find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID '{recipe_id}' not found."
        )

    if existing["created_by"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this recipe."
        )

    update_fields = data.model_dump(exclude_unset=True)

    # Serialize Ingredient objects if present
    if "ingredients" in update_fields and update_fields["ingredients"] is not None:
        update_fields["ingredients"] = [
            ing.model_dump() if hasattr(ing, "model_dump") else ing
            for ing in update_fields["ingredients"]
        ]

    update_fields["updated_at"] = datetime.now(timezone.utc)

    await db["recipes"].update_one({"_id": oid}, {"$set": update_fields})
    updated = await db["recipes"].find_one({"_id": oid})
    return RecipeResponse(**_serialize(updated))


async def delete_recipe(db, recipe_id: str, user_id: str) -> bool:
    oid = _validate_object_id(recipe_id)

    existing = await db["recipes"].find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID '{recipe_id}' not found."
        )

    if existing["created_by"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this recipe."
        )

    await db["recipes"].delete_one({"_id": oid})
    return True