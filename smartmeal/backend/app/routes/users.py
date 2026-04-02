from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, timezone
from bson import ObjectId
import bcrypt
from jose import jwt, JWTError
from ..db.database import get_db
from ..core.config import settings

router = APIRouter()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def get_user_id_from_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def serialize_user(user: dict) -> dict:
    return {
        "_id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user["email"],
        "role": user.get("role", "USER"),
        "preferences": user.get("preferences", {}),
    }


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    preferences: Optional[Any] = None


class PasswordChange(BaseModel):
    # Support both naming conventions
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    oldPassword: Optional[str] = None
    newPassword: Optional[str] = None


@router.get("/me")
async def get_profile(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": serialize_user(user)}


@router.put("/me")
async def update_profile(req: ProfileUpdate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    update = {}
    if req.name is not None:
        update["name"] = req.name
    if req.preferences is not None:
        update["preferences"] = req.preferences
    update["updated_at"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return {"user": serialize_user(user)}


@router.put("/me/password")
async def change_password(req: PasswordChange, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    old_pw = req.current_password or req.oldPassword
    new_pw = req.new_password or req.newPassword
    if not old_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Both old and new passwords are required")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not verify_password(old_pw, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": hash_password(new_pw)}}
    )
    return {"message": "Password updated successfully"}


@router.post("/change-password")
async def change_password_post(req: PasswordChange, authorization: Optional[str] = Header(None)):
    return await change_password(req, authorization)


@router.delete("/me")
async def delete_account(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"message": "Account deleted"}
