from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class StorageLocation(str, Enum):
    fridge = "fridge"
    freezer = "freezer"
    room = "room"

class LeftoverBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    quantity: str = Field(min_length=1)
    category: str = Field(min_length=1)
    cooked_date: datetime
    expiry_date: datetime
    storage_location: StorageLocation
    notes: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    ingredients: Optional[List[str]] = Field(default_factory=list)

    @field_validator('name')
    @classmethod
    def name_required(cls, v):
        if not v or not v.strip():
            raise ValueError('Food name is required')
        return v.strip()

    @field_validator('cooked_date')
    @classmethod
    def cooked_date_not_future(cls, v):
        now = datetime.now(timezone.utc) if v.tzinfo else datetime.now()
        if v > now:
            raise ValueError('Cooked date cannot be in the future')
        return v

    @field_validator('expiry_date')
    @classmethod
    def expiry_after_cooked(cls, v, info):
        if 'cooked_date' in info.data and v <= info.data['cooked_date']:
            raise ValueError('Expiry date must be after cooked date')
        return v

class LeftoverCreate(LeftoverBase):
    pass

class LeftoverUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[str] = None
    category: Optional[str] = None
    cooked_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[StorageLocation] = None
    notes: Optional[str] = Field(None, max_length=500)
    is_used: Optional[bool] = None
    image_url: Optional[str] = Field(None, max_length=500)
    ingredients: Optional[List[str]] = None

    @field_validator('cooked_date')
    @classmethod
    def cooked_date_not_future(cls, v):
        if v:
            now = datetime.now(timezone.utc) if v.tzinfo else datetime.now()
            if v > now:
                raise ValueError('Cooked date cannot be in the future')
        return v

class LeftoverResponse(LeftoverBase):
    id: str
    is_used: bool = False
    created_at: datetime
    days_until_expiry: int
