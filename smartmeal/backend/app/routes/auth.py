from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import UserCreate, UserResponse, UserInDB, Token, UserBase
from app.api.deps import get_current_user
from bson import ObjectId

router = APIRouter()

@router.post("/login")
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    db = get_db()
    user_dict = await db["users"].find_one({"email": form_data.username})
    if not user_dict:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    user_dict["_id"] = str(user_dict["_id"])
    user = UserInDB(**user_dict)
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "accessToken": create_access_token(
            subject=user.email, expires_delta=access_token_expires
        ),
        "user": UserResponse(**user.model_dump(by_alias=True)).model_dump(by_alias=True)
    }

@router.get("/me", response_model=dict)
async def read_users_me(
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    return {"user": UserResponse(**current_user.model_dump(by_alias=True)).model_dump(by_alias=True)}

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate) -> Any:
    db = get_db()
    # Case-insensitive email check
    user_exists = await db["users"].find_one({"email": {"$regex": f"^{user_in.email}$", "$options": "i"}})
    if user_exists:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user_dict = user_in.model_dump()
    password = user_dict.pop("password")
    user_dict["password_hash"] = get_password_hash(password)
    user_dict["createdAt"] = datetime.now(timezone.utc)
    user_dict["updatedAt"] = datetime.now(timezone.utc)
    
    new_user = await db["users"].insert_one(user_dict)
    
    created_user = await db["users"].find_one({"_id": new_user.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    
    return {
        "message": "registered",
        "user": UserResponse(**created_user).model_dump(by_alias=True)
    }

from app.models.user import GoogleLoginRequest
import secrets
import string

def generate_random_password(length=16):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(length))

@router.post("/google")
async def google_login(req: GoogleLoginRequest) -> Any:
    db = get_db()
    # Find user by email (case-insensitive)
    user_dict = await db["users"].find_one({"email": {"$regex": f"^{req.email}$", "$options": "i"}})
    
    if not user_dict:
        # Create a new user since they don't exist
        random_pwd = generate_random_password()
        new_user_data = {
            "name": req.name,
            "email": req.email.lower(),
            "role": "USER",
            "preferences": {}, # defaults
            "password_hash": get_password_hash(random_pwd),
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        insert_result = await db["users"].insert_one(new_user_data)
        user_dict = await db["users"].find_one({"_id": insert_result.inserted_id})
    else:
        # Update name if missing
        if not user_dict.get("name"):
            await db["users"].update_one({"_id": user_dict["_id"]}, {"$set": {"name": req.name}})
            user_dict["name"] = req.name
            
    user_dict["_id"] = str(user_dict["_id"])
    user = UserInDB(**user_dict)
    
    # Generate SmartMeal token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "accessToken": create_access_token(
            subject=user.email, expires_delta=access_token_expires
        ),
        "user": UserResponse(**user.model_dump(by_alias=True)).model_dump(by_alias=True)
    }
