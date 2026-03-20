from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    userId: str
    type: str
    message: str
    read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationInDB(NotificationBase):
    id: Optional[str] = Field(alias="_id", default=None)
    createdAt: datetime

class NotificationResponse(NotificationBase):
    id: str = Field(alias="_id")
    createdAt: datetime
