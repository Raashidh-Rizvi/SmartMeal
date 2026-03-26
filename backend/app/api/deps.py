from fastapi import Depends, HTTPException, status
from ..models.user import UserInDB

# Mock authentication - replace with real auth later
async def get_current_user() -> UserInDB:
    return UserInDB(**{"_id": "1", "email": "user@example.com", "is_active": True})