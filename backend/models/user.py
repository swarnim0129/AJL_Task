"""User models — Student, Alumni, Admin profiles."""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class UserRole(str, Enum):
    STUDENT = "student"
    ALUMNI = "alumni"
    ADMIN = "admin"


class AlumniTransferStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole = UserRole.STUDENT
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    # Student-specific fields
    branch: Optional[str] = None
    year: Optional[int] = None
    skills: List[str] = []
    resume_url: Optional[str] = None
    # Alumni-specific fields
    batch: Optional[int] = None
    company: Optional[str] = None
    role_title: Optional[str] = None
    linkedin_url: Optional[str] = None
    open_to_referrals: bool = False


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    skills: Optional[List[str]] = None
    resume_url: Optional[str] = None
    batch: Optional[int] = None
    company: Optional[str] = None
    role_title: Optional[str] = None
    linkedin_url: Optional[str] = None
    open_to_referrals: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlumniTransferRequest(BaseModel):
    user_id: str
    graduation_year: int
    current_company: Optional[str] = None
    linkedin_url: str
    status: AlumniTransferStatus = AlumniTransferStatus.PENDING
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AlumniTransferCreate(BaseModel):
    graduation_year: int
    current_company: Optional[str] = None
    linkedin_url: str
