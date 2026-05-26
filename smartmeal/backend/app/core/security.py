from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any

<<<<<<< HEAD
from passlib.context import CryptContext
=======
import bcrypt
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
from jose import jwt

from app.core.config import settings

<<<<<<< HEAD
# Use passlib with bcrypt — handles bcrypt 5.x safely
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
=======
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
<<<<<<< HEAD
    return encoded_jwt
=======
    return encoded_jwt.decode("utf-8") if isinstance(encoded_jwt, bytes) else encoded_jwt
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
