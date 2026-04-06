from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, timezone
from bson import ObjectId
from jose import jwt, JWTError
from bson.errors import InvalidId
from ..db.database import get_db
from ..core.config import settings
from ..utils.password_utils import (
    hash_password,
    verify_password,
    validate_password,
    check_password_reuse,
)

router = APIRouter()


def get_user_id_from_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload["sub"]
        if not isinstance(user_id, str):
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


def serialize_user(user: dict) -> dict:
    return {
        "_id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user["email"],
        "role": user.get("role", "USER"),
        "is_active": user.get("is_active", True),
        "preferences": user.get("preferences", {}),
        "createdAt": user.get("createdAt", user.get("created_at")),
    }


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    preferences: Optional[Any] = None


class PasswordChange(BaseModel):
    # Support both naming conventions from frontend
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    oldPassword: Optional[str] = None
    newPassword: Optional[str] = None


@router.get("/me")
async def get_profile(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    user = await db.users.find_one({"_id": to_object_id(user_id)})
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
    oid = to_object_id(user_id)
    await db.users.update_one({"_id": oid}, {"$set": update})
    user = await db.users.find_one({"_id": oid})
    return {"user": serialize_user(user)}


@router.put("/me/password")
async def change_password(req: PasswordChange, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)

    old_pw = req.current_password or req.oldPassword
    new_pw = req.new_password or req.newPassword

    if not old_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Both current and new passwords are required")

    db = get_db()
    oid = to_object_id(user_id)
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password using Argon2
    if not verify_password(old_pw, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Enforce password policy
    validation_errors = validate_password(new_pw, {"name": user.get("name"), "email": user.get("email")})
    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors[0])

    # Prevent reuse of last 5 passwords
    history = user.get("password_history", [])
    if check_password_reuse(new_pw, history):
        raise HTTPException(status_code=400, detail="Cannot reuse any of your last 5 passwords")

    # Hash with Argon2 and update
    new_hashed = hash_password(new_pw)
    new_history = [new_hashed] + history
    new_history = new_history[:5]  # Keep only last 5

    await db.users.update_one(
        {"_id": oid},
        {
            "$set": {
                "hashed_password": new_hashed,
                "password_history": new_history,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {"message": "Password updated successfully"}


@router.post("/change-password")
async def change_password_post(req: PasswordChange, authorization: Optional[str] = Header(None)):
    return await change_password(req, authorization)


@router.delete("/me")
async def delete_account(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    await db.users.delete_one({"_id": to_object_id(user_id)})
    return {"message": "Account deleted"}
