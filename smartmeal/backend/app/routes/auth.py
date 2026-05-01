from datetime import datetime, timedelta, timezone
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import UserCreate, UserResponse, UserInDB, Token, UserBase
from app.api.deps import get_current_user
from bson import ObjectId

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login")
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    db = get_db()
    login_email = form_data.username.strip().lower()
    user_dict = await db["users"].find_one({"email": {"$regex": f"^{login_email}$", "$options": "i"}})
    if not user_dict:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if login_email == "raashidhrizvi03@gmail.com" and user_dict.get("role") != "ADMIN":
        await db["users"].update_one({"_id": user_dict["_id"]}, {"$set": {"role": "ADMIN"}})
        user_dict["role"] = "ADMIN"
    
    user_dict["_id"] = str(user_dict["_id"])
    user = UserInDB(**user_dict)
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not user_dict.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    
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
    normalized_email = user_in.email.strip().lower()
    # Case-insensitive email check
    user_exists = await db["users"].find_one({"email": {"$regex": f"^{normalized_email}$", "$options": "i"}})
    if user_exists:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user_dict = user_in.model_dump()
    user_dict["email"] = normalized_email
    if normalized_email == "raashidhrizvi03@gmail.com":
        user_dict["role"] = "ADMIN"
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
    logger.info(f"Google Login attempt for email: {req.email}")
    
    try:
        # Find user by email (case-insensitive)
        user_dict = await db["users"].find_one({"email": {"$regex": f"^{req.email}$", "$options": "i"}})
        
        if not user_dict:
            logger.info(f"New Google user: {req.email}. Creating account.")
            # Create a new user since they don't exist
            random_pwd = generate_random_password()
            new_user_data = {
                "name": req.name,
                "email": req.email.lower(),
                "role": "ADMIN" if req.email.lower() == "raashidhrizvi03@gmail.com" else "USER",
                "is_active": True, # Explicitly set for new users
                "preferences": {}, # defaults
                "password_hash": get_password_hash(random_pwd),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc)
            }
            insert_result = await db["users"].insert_one(new_user_data)
            user_dict = await db["users"].find_one({"_id": insert_result.inserted_id})
        else:
            logger.info(f"Existing Google user found: {req.email}")
            # Ensure is_active is checked safely
            if not user_dict.get("is_active", True):
                logger.warning(f"Login blocked: Account disabled for {req.email}")
                raise HTTPException(status_code=403, detail=f"Account disabled for {req.email}")
                
            # Update missing fields to avoid Pydantic validation errors
            updates = {}
            if not user_dict.get("name"):
                updates["name"] = req.name
                user_dict["name"] = req.name
                
            if req.email.lower() == "raashidhrizvi03@gmail.com" and user_dict.get("role") != "ADMIN":
                updates["role"] = "ADMIN"
                user_dict["role"] = "ADMIN"
            
            # Check both field names to prevent overwriting existing passwords
            existing_hash = user_dict.get("password_hash") or user_dict.get("hashed_password")
            
            if not existing_hash:
                pwd_hash = get_password_hash(generate_random_password())
                updates["password_hash"] = pwd_hash
                user_dict["password_hash"] = pwd_hash
            elif not user_dict.get("password_hash") and user_dict.get("hashed_password"):
                # Migrate from legacy field name if only hashed_password exists
                updates["password_hash"] = existing_hash
                user_dict["password_hash"] = existing_hash
                
            if not user_dict.get("createdAt"):
                now = datetime.now(timezone.utc)
                updates["createdAt"] = now
                user_dict["createdAt"] = now
                
            if updates:
                await db["users"].update_one({"_id": user_dict["_id"]}, {"$set": updates})
                
        user_dict["_id"] = str(user_dict["_id"])
        
        # Validate data against UserInDB model
        try:
            user = UserInDB(**user_dict)
        except Exception as pydantic_err:
            logger.error(f"Pydantic validation failed for Google user {req.email}: {str(pydantic_err)}")
            # Log the dict keys to see what's missing
            logger.error(f"User dict keys: {list(user_dict.keys())}")
            raise HTTPException(status_code=500, detail="User data integrity error")
            
        # Generate SmartMeal token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(subject=user.email, expires_delta=access_token_expires)
        
        logger.info(f"Google Login successful for {req.email}")
        
        # Return a clean dictionary to avoid Pydantic serialization issues in the final step
        return {
            "accessToken": token,
            "user": {
                "id": str(user.id or user_dict.get("_id")),
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "preferences": user.preferences.model_dump() if hasattr(user.preferences, 'model_dump') else user.preferences,
                "createdAt": user.createdAt.isoformat() if hasattr(user.createdAt, 'isoformat') else str(user.createdAt),
                "updatedAt": user.updatedAt.isoformat() if hasattr(user.updatedAt, 'isoformat') else str(user.updatedAt)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

from app.models.user import ForgotPasswordRequest, ResetPasswordRequest
import random

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    db = get_db()
    user = await db["users"].find_one({"email": {"$regex": f"^{req.email.strip()}$", "$options": "i"}})
    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please check your email.")
    
    otp = str(random.randint(100000, 999999))
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db["otps"].update_one(
        {"email": req.email.strip().lower()},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True
    )
    
    # Send real email via utility
    from app.utils.email import send_otp_email
    send_otp_email(req.email.strip(), otp)
    
    return {"message": "OTP has been sent to your email address."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    db = get_db()
    email_normalized = req.email.strip().lower()
    otp_record = await db["otps"].find_one({"email": email_normalized})
    
    if not otp_record or otp_record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please try again.")
    
    # Handle both aware and naive datetimes from MongoDB
    expiry = otp_record["expiry"]
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Update password
    new_password_hash = get_password_hash(req.newPassword)
    await db["users"].update_one(
        {"email": {"$regex": f"^{email_normalized}$", "$options": "i"}},
        {"$set": {
            "password_hash": new_password_hash, 
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    # Delete the used OTP
    await db["otps"].delete_one({"email": email_normalized})
    
    return {"message": "Your password has been reset successfully."}

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    db = get_db()
    email_normalized = req.email.strip().lower()
    otp_record = await db["otps"].find_one({"email": email_normalized})
    
    if not otp_record or otp_record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    expiry = otp_record["expiry"]
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    return {"message": "OTP verified successfully"}
