import logging
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import decode_access_token
from typing import Optional

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)

# Robust dependency to get user ID from token
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    # 1. Try to get token from Authorization header if present
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    
    if not token:
        # Fallback for unauthenticated dev use (can be disabled in production)
        return "000000000000000000000001"
        
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id