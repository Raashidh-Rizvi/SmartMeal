from fastapi import Depends, HTTPException, status
from ..models.user import UserInDB

# Mock authentication - replace with real auth later
async def get_current_user() -> UserInDB:
    # Mock user for now
    return UserInDB(id="1", email="user@example.com", is_active=True)