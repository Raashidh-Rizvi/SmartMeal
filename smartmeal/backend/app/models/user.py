from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserPreferences(BaseModel):
    dietType: Optional[str] = None
    allergies: List[str] = []
    cuisinePreferences: List[str] = []
    budgetLevel: Optional[str] = None
    householdSize: int = 1

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "USER"
    preferences: UserPreferences = Field(default_factory=UserPreferences)

class UserCreate(UserBase):
    password: str

class PasswordUpdate(BaseModel):
    oldPassword: str
    newPassword: str

class UserInDB(UserBase):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(alias="_id", default=None)
    password_hash: str
    createdAt: datetime
    updatedAt: datetime

class UserResponse(UserBase):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

class Token(BaseModel):
    accessToken: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    userId: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    email: str
    name: str
    firebaseToken: str
    uid: str
