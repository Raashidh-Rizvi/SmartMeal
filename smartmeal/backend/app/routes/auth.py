from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..utils.password_utils import hash_password, verify_password, validate_password, check_password_reuse
import random
import string
from jose import jwt, JWTError
from bson.errors import InvalidId
from ..db.database import get_db
from ..core.config import settings
from ..utils.email import send_otp_email

router = APIRouter()

def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


# Removed local bcrypt-based hash/verify functions as we now use password_utils


from pydantic import BaseModel, Field, EmailStr

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(...)  # Validation handled in logic


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    firebaseToken: str
    uid: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str = Field(...)  # Validation handled in logic


def create_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def serialize_user(doc: dict) -> dict:
    return {
        "_id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc["email"],
        "role": doc.get("role", "USER"),
        "is_active": doc.get("is_active", True),
        "preferences": doc.get("preferences", {}),
        "createdAt": doc.get("createdAt", doc.get("created_at")),
    }


@router.post("/register")
async def register(req: RegisterRequest):
    print("RECEIVED REGISTER REQUEST")
    db = get_db()
    email = req.email.lower().strip()
    
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Password Validation
    validation_errors = validate_password(req.password, {"name": req.name, "email": email})
    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors[0]) # Return first error for simplicity

    now = datetime.now(timezone.utc)
    hashed = hash_password(req.password)
    result = await db.users.insert_one({
        "name": req.name,
        "email": email,
        "hashed_password": hashed,
        "role": "USER",
        "is_active": True,
        "createdAt": now,
        "password_history": [hashed],
        "login_attempts": 0,
        "lockout_until": None,
    })
    user = await db.users.find_one({"_id": result.inserted_id})
    u = serialize_user(user)
    return {"user": u, "accessToken": create_token({"sub": u["_id"], "role": u["role"]})}


@router.post("/login")
async def login(req: LoginRequest):
    db = get_db()
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Check Lockout
    lockout_until = user.get("lockout_until")
    if lockout_until:
        if lockout_until.tzinfo is None:
            lockout_until = lockout_until.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < lockout_until:
            diff = (lockout_until - datetime.now(timezone.utc)).total_seconds()
            minutes = int(diff // 60) + 1
            raise HTTPException(status_code=403, detail=f"Account locked. Try again in {minutes} minutes.")

    if not verify_password(req.password, user.get("hashed_password", "")):
        # Increment attempts
        attempts = user.get("login_attempts", 0) + 1
        update_data = {"login_attempts": attempts}
        
        if attempts >= 5:
            update_data["lockout_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
            update_data["login_attempts"] = 0 # Reset after lockout starts
            
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Reset attempts on success
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"login_attempts": 0, "lockout_until": None}})
    
    u = serialize_user(user)
    return {"user": u, "accessToken": create_token({"sub": u["_id"], "role": u["role"]})}


@router.post("/google")
async def google_auth(req: GoogleAuthRequest):
    db = get_db()
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        now = datetime.now(timezone.utc)
        result = await db.users.insert_one({
            "name": req.name or email.split("@")[0],
            "email": email,
            "uid": req.uid,
            "role": "USER",
            "is_active": True,
            "createdAt": now,
        })
        user = await db.users.find_one({"_id": result.inserted_id})
    u = serialize_user(user)
    return {"user": u, "accessToken": create_token({"sub": u["_id"], "role": u["role"]})}


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    db = get_db()
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": serialize_user(user)}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    db = get_db()
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        # For security, don't explicitly say the email doesn't exist
        return {"message": "If an account exists with this email, you will receive an OTP shortly."}

    # Generate 6-digit OTP
    otp = "".join(random.choices(string.digits, k=6))
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Store OTP in DB
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": otp, "reset_otp_expiry": expiry}}
    )

    # Send matching email
    send_otp_email(email, otp)
    return {"message": "OTP sent successfully"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    db = get_db()
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check OTP and expiry
    stored_otp = user.get("reset_otp")
    expiry = user.get("reset_otp_expiry")

    if not stored_otp or not expiry:
        raise HTTPException(status_code=400, detail="No OTP requested")

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if stored_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP has expired")

    # Password Policy Validation
    validation_errors = validate_password(req.newPassword, {"name": user.get("name"), "email": email})
    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors[0])
        
    # Check Password Reuse (last 5)
    history = user.get("password_history", [])
    if check_password_reuse(req.newPassword, history):
        raise HTTPException(status_code=400, detail="Cannot reuse any of your last 5 passwords")

    # Update password, history, and clear OTP
    new_hashed_password = hash_password(req.newPassword)
    new_history = [new_hashed_password] + history
    new_history = new_history[:5] # Keep only last 5

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": new_hashed_password,
                "password_history": new_history,
                "login_attempts": 0,
                "lockout_until": None
            },
            "$unset": {"reset_otp": "", "reset_otp_expiry": ""}
        }
    )

    return {"message": "Password reset successfully"}
