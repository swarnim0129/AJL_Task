"""Messages API routes — conversations and 1-to-1 messaging."""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime

from database import get_database
from models.message import MessageCreate

router = APIRouter()


@router.get("/conversations")
async def list_conversations(user_id: str = Query(...)):
    """List all conversations for a user."""
    db = get_database()

    # Get all messages involving this user
    pipeline = [
        {"$match": {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {
                "$cond": [
                    {"$eq": ["$sender_id", user_id]},
                    "$receiver_id",
                    "$sender_id"
                ]
            },
            "last_message": {"$first": "$content"},
            "last_message_at": {"$first": "$created_at"},
            "unread_count": {
                "$sum": {
                    "$cond": [
                        {"$and": [
                            {"$eq": ["$receiver_id", user_id]},
                            {"$eq": ["$read", False]}
                        ]},
                        1, 0
                    ]
                }
            }
        }},
        {"$sort": {"last_message_at": -1}}
    ]

    conversations = []
    async for conv in db.messages.aggregate(pipeline):
        participant_id = conv["_id"]
        participant = await db.users.find_one({"_id": ObjectId(participant_id)})
        if participant:
            conversations.append({
                "id": participant_id,
                "participant_id": participant_id,
                "participant_name": participant["name"],
                "participant_avatar": participant.get("avatar_url"),
                "participant_role": participant.get("role", "student"),
                "last_message": conv["last_message"],
                "last_message_at": conv["last_message_at"],
                "unread_count": conv["unread_count"],
            })
    return conversations


@router.get("/{other_user_id}")
async def get_messages(other_user_id: str, user_id: str = Query(...)):
    """Get messages between two users."""
    db = get_database()
    query = {
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id},
        ]
    }
    messages = []
    async for msg in db.messages.find(query).sort("created_at", 1):
        sender = await db.users.find_one({"_id": ObjectId(msg["sender_id"])})
        messages.append({
            "id": str(msg["_id"]),
            "sender_id": msg["sender_id"],
            "receiver_id": msg["receiver_id"],
            "sender_name": sender["name"] if sender else "Unknown",
            "sender_avatar": sender.get("avatar_url") if sender else None,
            "content": msg["content"],
            "created_at": msg["created_at"],
        })

    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "read": False},
        {"$set": {"read": True}}
    )

    return messages


@router.post("/")
async def send_message(message: MessageCreate, sender_id: str = Query(...)):
    """Send a message to another user."""
    db = get_database()
    sender = await db.users.find_one({"_id": ObjectId(sender_id)})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    receiver = await db.users.find_one({"_id": ObjectId(message.receiver_id)})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    msg_doc = {
        "sender_id": sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "read": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.messages.insert_one(msg_doc)
    created = await db.messages.find_one({"_id": result.inserted_id})
    return {
        "id": str(created["_id"]),
        "sender_id": sender_id,
        "receiver_id": message.receiver_id,
        "sender_name": sender["name"],
        "sender_avatar": sender.get("avatar_url"),
        "content": created["content"],
        "created_at": created["created_at"],
    }
