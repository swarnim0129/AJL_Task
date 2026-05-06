"""Referral request API routes."""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional

from database import get_database
from models.referral import ReferralRequestCreate, ReferralStatusUpdate

router = APIRouter()


def referral_helper(ref: dict) -> dict:
    return {
        "id": str(ref["_id"]),
        "student_id": ref.get("student_id", ""),
        "alumni_id": ref.get("alumni_id", ""),
        "job_link": ref.get("job_link", ""),
        "company": ref.get("company"),
        "role_title": ref.get("role_title"),
        "message": ref.get("message", ""),
        "resume_url": ref.get("resume_url"),
        "status": ref.get("status", "pending"),
        "student_name": ref.get("student_name", ""),
        "student_avatar": ref.get("student_avatar"),
        "student_branch": ref.get("student_branch"),
        "student_year": ref.get("student_year"),
        "alumni_name": ref.get("alumni_name", ""),
        "alumni_avatar": ref.get("alumni_avatar"),
        "alumni_company": ref.get("alumni_company"),
        "created_at": ref.get("created_at", datetime.utcnow()),
        "updated_at": ref.get("updated_at", datetime.utcnow()),
    }


@router.get("/")
async def list_referral_requests(
    student_id: Optional[str] = None,
    alumni_id: Optional[str] = None,
    status: Optional[str] = None,
):
    db = get_database()
    query = {}
    if student_id:
        query["student_id"] = student_id
    if alumni_id:
        query["alumni_id"] = alumni_id
    if status:
        query["status"] = status
    requests = []
    async for ref in db.referral_requests.find(query).sort("created_at", -1):
        requests.append(referral_helper(ref))
    return requests


@router.get("/{request_id}")
async def get_referral_request(request_id: str):
    db = get_database()
    ref = await db.referral_requests.find_one({"_id": ObjectId(request_id)})
    if not ref:
        raise HTTPException(status_code=404, detail="Referral request not found")
    return referral_helper(ref)


@router.post("/")
async def create_referral_request(request: ReferralRequestCreate, student_id: str = Query(...)):
    db = get_database()
    student = await db.users.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    alumni = await db.users.find_one({"_id": ObjectId(request.alumni_id)})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")

    ref_doc = {
        "student_id": student_id,
        "alumni_id": request.alumni_id,
        "job_link": request.job_link,
        "company": request.company,
        "role_title": request.role_title,
        "message": request.message,
        "resume_url": request.resume_url or student.get("resume_url"),
        "status": "pending",
        "student_name": student["name"],
        "student_avatar": student.get("avatar_url"),
        "student_branch": student.get("branch"),
        "student_year": student.get("year"),
        "alumni_name": alumni["name"],
        "alumni_avatar": alumni.get("avatar_url"),
        "alumni_company": alumni.get("company"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.referral_requests.insert_one(ref_doc)

    await db.notifications.insert_one({
        "user_id": request.alumni_id,
        "type": "referral_request",
        "title": "New Referral Request",
        "content": f"{student['name']} sent you a referral request for {request.company or 'a position'}",
        "related_id": str(result.inserted_id),
        "related_type": "referral_request",
        "read": False,
        "created_at": datetime.utcnow(),
    })

    created = await db.referral_requests.find_one({"_id": result.inserted_id})
    return referral_helper(created)


@router.patch("/{request_id}/status")
async def update_referral_status(request_id: str, status_update: ReferralStatusUpdate):
    db = get_database()
    ref = await db.referral_requests.find_one({"_id": ObjectId(request_id)})
    if not ref:
        raise HTTPException(status_code=404, detail="Referral request not found")

    await db.referral_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}}
    )

    status_text = "accepted" if status_update.status == "accepted" else "rejected"
    await db.notifications.insert_one({
        "user_id": ref["student_id"],
        "type": f"referral_{status_text}",
        "title": f"Referral Request {status_text.capitalize()}",
        "content": f"{ref.get('alumni_name', 'An alumni')} has {status_text} your referral request",
        "related_id": request_id,
        "related_type": "referral_request",
        "read": False,
        "created_at": datetime.utcnow(),
    })

    updated = await db.referral_requests.find_one({"_id": ObjectId(request_id)})
    return referral_helper(updated)
