from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
from jose import jwt, JWTError
from ..db.database import get_db
from ..core.config import settings

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    email: str
    name: Optional[str] = None
    firebaseToken: str
    uid: str


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
    }


@router.post("/register")
async def register(req: RegisterRequest):
    db = get_db()
    if await db.users.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    now = datetime.now(timezone.utc)
    result = await db.users.insert_one({
        "name": req.name,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "role": "USER",
        "is_active": True,
        "created_at": now,
    })
    user = await db.users.find_one({"_id": result.inserted_id})
    u = serialize_user(user)
    return {"user": u, "accessToken": create_token({"sub": u["_id"], "role": u["role"]})}


@router.post("/login")
async def login(req: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    u = serialize_user(user)
    return {"user": u, "accessToken": create_token({"sub": u["_id"], "role": u["role"]})}


@router.post("/google")
async def google_auth(req: GoogleAuthRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email})
    if not user:
        now = datetime.now(timezone.utc)
        result = await db.users.insert_one({
            "name": req.name or req.email.split("@")[0],
            "email": req.email,
            "uid": req.uid,
            "role": "USER",
            "is_active": True,
            "created_at": now,
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
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": serialize_user(user)}
