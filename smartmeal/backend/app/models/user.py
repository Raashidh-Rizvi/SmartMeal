from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    is_active: bool = True

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True