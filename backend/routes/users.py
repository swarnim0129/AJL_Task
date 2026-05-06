"""User API routes — CRUD, profile management, alumni transfer."""

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from typing import Optional

from database import get_database
from models.user import UserCreate, UserUpdate, UserResponse, AlumniTransferCreate

router = APIRouter()


def user_helper(user: dict) -> dict:
    """Convert MongoDB user document to response dict."""
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "student"),
        "avatar_url": user.get("avatar_url"),
        "bio": user.get("bio"),
        "branch": user.get("branch"),
        "year": user.get("year"),
        "skills": user.get("skills", []),
        "resume_url": user.get("resume_url"),
        "batch": user.get("batch"),
        "company": user.get("company"),
        "role_title": user.get("role_title"),
        "linkedin_url": user.get("linkedin_url"),
        "open_to_referrals": user.get("open_to_referrals", False),
        "created_at": user.get("created_at", datetime.utcnow()),
        "updated_at": user.get("updated_at", datetime.utcnow()),
    }


@router.get("/")
async def list_users(role: Optional[str] = None):
    """List all users, optionally filtered by role."""
    db = get_database()
    query = {}
    if role:
        query["role"] = role
    users = []
    async for user in db.users.find(query).sort("name", 1):
        users.append(user_helper(user))
    return users


@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get a specific user by ID."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user)


@router.post("/")
async def create_user(user: UserCreate):
    """Create a new user."""
    db = get_database()
    user_dict = user.model_dump()
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return user_helper(created_user)


@router.put("/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate):
    """Update a user's profile."""
    db = get_database()
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.utcnow()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return user_helper(user)


@router.patch("/{user_id}/toggle-referrals")
async def toggle_open_to_referrals(user_id: str):
    """Toggle alumni's 'Open to Referrals' status."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") != "alumni":
        raise HTTPException(status_code=403, detail="Only alumni can toggle referral status")
    new_status = not user.get("open_to_referrals", False)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"open_to_referrals": new_status, "updated_at": datetime.utcnow()}}
    )
    return {"open_to_referrals": new_status}


@router.post("/{user_id}/switch-to-alumni")
async def request_alumni_switch(user_id: str, request: AlumniTransferCreate):
    """Submit a request to switch from student to alumni."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") != "student":
        raise HTTPException(status_code=400, detail="Only students can request alumni switch")

    # Check for existing pending request
    existing = await db.alumni_transfers.find_one({
        "user_id": user_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending transfer request")

    transfer_doc = {
        "user_id": user_id,
        "graduation_year": request.graduation_year,
        "current_company": request.current_company,
        "linkedin_url": request.linkedin_url,
        "status": "pending",
        "rejection_reason": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.alumni_transfers.insert_one(transfer_doc)
    transfer_doc["id"] = str(result.inserted_id)

    # Create notification for admin
    admin_users = []
    async for admin in db.users.find({"role": "admin"}):
        admin_users.append(admin)

    for admin in admin_users:
        await db.notifications.insert_one({
            "user_id": str(admin["_id"]),
            "type": "alumni_transfer_request",
            "title": "New Alumni Transfer Request",
            "content": f"{user['name']} has requested to switch to alumni status",
            "related_id": str(result.inserted_id),
            "related_type": "alumni_transfer",
            "read": False,
            "created_at": datetime.utcnow(),
        })

    return {"message": "Transfer request submitted successfully", "request_id": str(result.inserted_id)}


@router.get("/{user_id}/transfer-status")
async def get_transfer_status(user_id: str):
    """Get the status of a user's alumni transfer request."""
    db = get_database()
    transfer = await db.alumni_transfers.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    if not transfer:
        return {"status": None, "message": "No transfer request found"}
    return {
        "id": str(transfer["_id"]),
        "status": transfer["status"],
        "graduation_year": transfer["graduation_year"],
        "current_company": transfer.get("current_company"),
        "linkedin_url": transfer["linkedin_url"],
        "rejection_reason": transfer.get("rejection_reason"),
        "created_at": transfer["created_at"],
    }
