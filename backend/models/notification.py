"""Notification models."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class NotificationType(str, Enum):
    CONNECTION_REQUEST = "connection_request"
    CONNECTION_ACCEPTED = "connection_accepted"
    REFERRAL_REQUEST = "referral_request"
    REFERRAL_ACCEPTED = "referral_accepted"
    REFERRAL_REJECTED = "referral_rejected"
    ALUMNI_VERIFIED = "alumni_verified"
    ALUMNI_REJECTED = "alumni_rejected"
    NEW_POST = "new_post"
    COMMENT = "comment"
    LIKE = "like"


class NotificationBase(BaseModel):
    user_id: str
    type: NotificationType
    title: str
    content: str
    related_id: Optional[str] = None
    related_type: Optional[str] = None
    read: bool = False


class NotificationResponse(NotificationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
