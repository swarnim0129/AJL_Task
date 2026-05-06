"""Post models — Referral opportunities, job openings, guidance posts."""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class PostType(str, Enum):
    REFERRAL = "referral"
    OPPORTUNITY = "opportunity"
    GUIDANCE = "guidance"


class Comment(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PostBase(BaseModel):
    author_id: str
    type: PostType
    title: str
    content: str
    company: Optional[str] = None
    job_link: Optional[str] = None
    location: Optional[str] = None
    tags: List[str] = []


class PostCreate(BaseModel):
    type: PostType
    title: str
    content: str
    company: Optional[str] = None
    job_link: Optional[str] = None
    location: Optional[str] = None
    tags: List[str] = []


class PostResponse(PostBase):
    id: str
    author_name: str
    author_avatar: Optional[str] = None
    author_role: str
    author_company: Optional[str] = None
    likes: List[str] = []
    comments: List[Comment] = []
    saved_by: List[str] = []
    like_count: int = 0
    comment_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
