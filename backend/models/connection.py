"""Connection models."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ConnectionBase(BaseModel):
    requester_id: str
    receiver_id: str
    status: ConnectionStatus = ConnectionStatus.PENDING


class ConnectionCreate(BaseModel):
    receiver_id: str


class ConnectionResponse(ConnectionBase):
    id: str
    requester_name: str
    requester_avatar: Optional[str] = None
    requester_role: str
    receiver_name: str
    receiver_avatar: Optional[str] = None
    receiver_role: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConnectionStatusUpdate(BaseModel):
    status: ConnectionStatus
