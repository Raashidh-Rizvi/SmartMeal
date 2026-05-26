from fastapi import Depends, HTTPException, status
<<<<<<< HEAD
=======
from typing import Optional
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.models.user import TokenData, UserInDB
from app.db.database import get_db

<<<<<<< HEAD
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
=======
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    db = get_db()
<<<<<<< HEAD
    user_dict = await db["users"].find_one({"email": token_data.email})
=======
    user_dict = await db["users"].find_one({"email": {"$regex": f"^{token_data.email}$", "$options": "i"}})
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    if user_dict is None:
        raise credentials_exception
        
    user_dict["_id"] = str(user_dict["_id"])
    return UserInDB(**user_dict)

<<<<<<< HEAD
=======
async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[UserInDB]:
    """Optional version of get_current_user that doesn't raise if token is missing."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        token_data = TokenData(email=email)
    except JWTError:
        return None
        
    db = get_db()
    user_dict = await db["users"].find_one({"email": {"$regex": f"^{token_data.email}$", "$options": "i"}})
    if user_dict is None:
        return None
        
    user_dict["_id"] = str(user_dict["_id"])
    return UserInDB(**user_dict)

async def get_current_user_id(current_user: UserInDB = Depends(get_current_user)) -> str:
    """Helper dependency to get just the user ID string."""
    return str(current_user.id)

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
async def require_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
