"""Referral request models."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class RequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ReferralRequestBase(BaseModel):
    student_id: str
    alumni_id: str
    job_link: str
    company: Optional[str] = None
    role_title: Optional[str] = None
    message: str
    resume_url: Optional[str] = None
    status: RequestStatus = RequestStatus.PENDING


class ReferralRequestCreate(BaseModel):
    alumni_id: str
    job_link: str
    company: Optional[str] = None
    role_title: Optional[str] = None
    message: str
    resume_url: Optional[str] = None


class ReferralRequestResponse(ReferralRequestBase):
    id: str
    student_name: str
    student_avatar: Optional[str] = None
    student_branch: Optional[str] = None
    student_year: Optional[int] = None
    alumni_name: str
    alumni_avatar: Optional[str] = None
    alumni_company: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReferralStatusUpdate(BaseModel):
    status: RequestStatus
