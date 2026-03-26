from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
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


class ProfileUpdate(BaseModel):
    name: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
async def get_profile(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "_id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user["email"],
        "role": user.get("role", "USER"),
    }


@router.put("/me")
async def update_profile(req: ProfileUpdate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return {"_id": str(user["_id"]), "name": user.get("name", ""), "email": user["email"]}


@router.post("/change-password")
async def change_password(req: PasswordChange, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not verify_password(req.current_password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": hash_password(req.new_password)}}
    )
    return {"message": "Password updated successfully"}


@router.delete("/me")
async def delete_account(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    db = get_db()
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"message": "Account deleted"}
