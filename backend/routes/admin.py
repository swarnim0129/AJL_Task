"""Admin API routes — alumni verification, content moderation."""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional

from database import get_database

router = APIRouter()


@router.get("/pending-verifications")
async def list_pending_verifications():
    """List all pending alumni transfer requests."""
    db = get_database()
    transfers = []
    async for t in db.alumni_transfers.find({"status": "pending"}).sort("created_at", -1):
        user = await db.users.find_one({"_id": ObjectId(t["user_id"])})
        transfers.append({
            "id": str(t["_id"]),
            "user_id": t["user_id"],
            "user_name": user["name"] if user else "Unknown",
            "user_email": user.get("email", "") if user else "",
            "user_avatar": user.get("avatar_url") if user else None,
            "graduation_year": t["graduation_year"],
            "current_company": t.get("current_company"),
            "linkedin_url": t["linkedin_url"],
            "status": t["status"],
            "created_at": t["created_at"],
        })
    return transfers


@router.patch("/verify/{transfer_id}")
async def verify_alumni(transfer_id: str, approved: bool = Query(...), rejection_reason: Optional[str] = None):
    """Approve or reject an alumni transfer request."""
    db = get_database()
    transfer = await db.alumni_transfers.find_one({"_id": ObjectId(transfer_id)})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    if approved:
        await db.alumni_transfers.update_one(
            {"_id": ObjectId(transfer_id)},
            {"$set": {"status": "approved"}}
        )
        await db.users.update_one(
            {"_id": ObjectId(transfer["user_id"])},
            {"$set": {
                "role": "alumni",
                "batch": transfer["graduation_year"],
                "company": transfer.get("current_company"),
                "linkedin_url": transfer["linkedin_url"],
                "updated_at": datetime.utcnow(),
            }}
        )
        await db.notifications.insert_one({
            "user_id": transfer["user_id"],
            "type": "alumni_verified",
            "title": "Alumni Status Approved!",
            "content": "Your alumni verification has been approved. You can now post referrals and opportunities.",
            "related_id": transfer_id,
            "related_type": "alumni_transfer",
            "read": False,
            "created_at": datetime.utcnow(),
        })
        return {"message": "Alumni verified successfully"}
    else:
        await db.alumni_transfers.update_one(
            {"_id": ObjectId(transfer_id)},
            {"$set": {"status": "rejected", "rejection_reason": rejection_reason or "Not specified"}}
        )
        await db.notifications.insert_one({
            "user_id": transfer["user_id"],
            "type": "alumni_rejected",
            "title": "Alumni Verification Rejected",
            "content": f"Your alumni verification was rejected. Reason: {rejection_reason or 'Not specified'}",
            "related_id": transfer_id,
            "related_type": "alumni_transfer",
            "read": False,
            "created_at": datetime.utcnow(),
        })
        return {"message": "Alumni verification rejected"}


@router.get("/users")
async def admin_list_users(role: Optional[str] = None):
    """Admin: list all users."""
    db = get_database()
    query = {}
    if role:
        query["role"] = role
    users = []
    async for user in db.users.find(query).sort("created_at", -1):
        users.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user.get("email", ""),
            "role": user.get("role", "student"),
            "avatar_url": user.get("avatar_url"),
            "company": user.get("company"),
            "created_at": user.get("created_at"),
        })
    return users


@router.delete("/users/{user_id}")
async def admin_remove_user(user_id: str):
    """Admin: remove a user."""
    db = get_database()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User removed"}


@router.delete("/posts/{post_id}")
async def admin_remove_post(post_id: str):
    """Admin: remove a post."""
    db = get_database()
    result = await db.posts.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post removed"}


@router.get("/stats")
async def admin_stats():
    """Admin: get platform statistics."""
    db = get_database()
    total_users = await db.users.count_documents({})
    students = await db.users.count_documents({"role": "student"})
    alumni = await db.users.count_documents({"role": "alumni"})
    total_posts = await db.posts.count_documents({})
    pending_refs = await db.referral_requests.count_documents({"status": "pending"})
    pending_transfers = await db.alumni_transfers.count_documents({"status": "pending"})
    return {
        "total_users": total_users,
        "students": students,
        "alumni": alumni,
        "total_posts": total_posts,
        "pending_referrals": pending_refs,
        "pending_transfers": pending_transfers,
    }
