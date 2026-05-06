"""Message & conversation models."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MessageBase(BaseModel):
    sender_id: str
    receiver_id: str
    content: str


class MessageCreate(BaseModel):
    receiver_id: str
    content: str


class MessageResponse(MessageBase):
    id: str
    sender_name: str
    sender_avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    participant_id: str
    participant_name: str
    participant_avatar: Optional[str] = None
    participant_role: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True
