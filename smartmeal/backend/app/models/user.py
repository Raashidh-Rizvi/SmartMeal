from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str
    is_active: bool = True

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: Optional[str] = None
    created_at: Optional[datetime] = None
    role: str = "USER"
    password_history: List[str] = []
    login_attempts: int = 0
    lockout_until: Optional[datetime] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None

    class Config:
        populate_by_name = True