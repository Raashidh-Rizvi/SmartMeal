from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, List, Any
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
    oldPassword: Optional[str] = None
    otp: Optional[str] = None
    newPassword: str

class UserInDB(UserBase):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(alias="_id", default=None)
    password_hash: str
    createdAt: datetime
    updatedAt: datetime

    @model_validator(mode='before')
    @classmethod
    def handle_legacy_password(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Map legacy field name if new one is missing
            if "hashed_password" in data and "password_hash" not in data:
                data["password_hash"] = data.get("hashed_password")
            
            # Map legacy createdAt/updatedAt if new ones are missing
            if "created_at" in data and "createdAt" not in data:
                data["createdAt"] = data.get("created_at")
            if "updated_at" in data and "updatedAt" not in data:
                data["updatedAt"] = data.get("updated_at")
        return data

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

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    newPassword: str
