"""Notification API routes."""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime

from database import get_database

router = APIRouter()


def notif_helper(notif: dict) -> dict:
    return {
        "id": str(notif["_id"]),
        "user_id": notif.get("user_id", ""),
        "type": notif.get("type", ""),
        "title": notif.get("title", ""),
        "content": notif.get("content", ""),
        "related_id": notif.get("related_id"),
        "related_type": notif.get("related_type"),
        "read": notif.get("read", False),
        "created_at": notif.get("created_at", datetime.utcnow()),
    }


@router.get("/")
async def list_notifications(user_id: str = Query(...)):
    db = get_database()
    notifications = []
    async for notif in db.notifications.find({"user_id": user_id}).sort("created_at", -1):
        notifications.append(notif_helper(notif))
    return notifications


@router.get("/unread-count")
async def get_unread_count(user_id: str = Query(...)):
    db = get_database()
    count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    db = get_database()
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_as_read(user_id: str = Query(...)):
    db = get_database()
    await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}
