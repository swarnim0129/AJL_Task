"""Connection API routes."""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional

from database import get_database
from models.connection import ConnectionCreate, ConnectionStatusUpdate

router = APIRouter()


def conn_helper(conn: dict) -> dict:
    return {
        "id": str(conn["_id"]),
        "requester_id": conn.get("requester_id", ""),
        "receiver_id": conn.get("receiver_id", ""),
        "status": conn.get("status", "pending"),
        "requester_name": conn.get("requester_name", ""),
        "requester_avatar": conn.get("requester_avatar"),
        "requester_role": conn.get("requester_role", ""),
        "receiver_name": conn.get("receiver_name", ""),
        "receiver_avatar": conn.get("receiver_avatar"),
        "receiver_role": conn.get("receiver_role", ""),
        "created_at": conn.get("created_at", datetime.utcnow()),
    }


@router.get("/")
async def list_connections(user_id: str = Query(...), status: Optional[str] = None):
    db = get_database()
    query = {"$or": [{"requester_id": user_id}, {"receiver_id": user_id}]}
    if status:
        query["status"] = status
    connections = []
    async for conn in db.connections.find(query).sort("created_at", -1):
        connections.append(conn_helper(conn))
    return connections


@router.get("/accepted")
async def list_accepted_connections(user_id: str = Query(...)):
    db = get_database()
    query = {
        "$or": [{"requester_id": user_id}, {"receiver_id": user_id}],
        "status": "accepted"
    }
    connections = []
    async for conn in db.connections.find(query).sort("created_at", -1):
        connections.append(conn_helper(conn))
    return connections


@router.get("/pending")
async def list_pending_connections(user_id: str = Query(...)):
    db = get_database()
    query = {"receiver_id": user_id, "status": "pending"}
    connections = []
    async for conn in db.connections.find(query).sort("created_at", -1):
        connections.append(conn_helper(conn))
    return connections


@router.post("/")
async def send_connection_request(request: ConnectionCreate, requester_id: str = Query(...)):
    db = get_database()
    requester = await db.users.find_one({"_id": ObjectId(requester_id)})
    if not requester:
        raise HTTPException(status_code=404, detail="Requester not found")
    receiver = await db.users.find_one({"_id": ObjectId(request.receiver_id)})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    existing = await db.connections.find_one({
        "$or": [
            {"requester_id": requester_id, "receiver_id": request.receiver_id},
            {"requester_id": request.receiver_id, "receiver_id": requester_id},
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")

    conn_doc = {
        "requester_id": requester_id,
        "receiver_id": request.receiver_id,
        "status": "pending",
        "requester_name": requester["name"],
        "requester_avatar": requester.get("avatar_url"),
        "requester_role": requester.get("role", "student"),
        "receiver_name": receiver["name"],
        "receiver_avatar": receiver.get("avatar_url"),
        "receiver_role": receiver.get("role", "student"),
        "created_at": datetime.utcnow(),
    }
    result = await db.connections.insert_one(conn_doc)

    await db.notifications.insert_one({
        "user_id": request.receiver_id,
        "type": "connection_request",
        "title": "New Connection Request",
        "content": f"{requester['name']} wants to connect with you",
        "related_id": str(result.inserted_id),
        "related_type": "connection",
        "read": False,
        "created_at": datetime.utcnow(),
    })

    created = await db.connections.find_one({"_id": result.inserted_id})
    return conn_helper(created)


@router.patch("/{connection_id}/status")
async def update_connection_status(connection_id: str, status_update: ConnectionStatusUpdate):
    db = get_database()
    conn = await db.connections.find_one({"_id": ObjectId(connection_id)})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    await db.connections.update_one(
        {"_id": ObjectId(connection_id)},
        {"$set": {"status": status_update.status}}
    )

    if status_update.status == "accepted":
        await db.notifications.insert_one({
            "user_id": conn["requester_id"],
            "type": "connection_accepted",
            "title": "Connection Accepted",
            "content": f"{conn['receiver_name']} accepted your connection request",
            "related_id": connection_id,
            "related_type": "connection",
            "read": False,
            "created_at": datetime.utcnow(),
        })

    updated = await db.connections.find_one({"_id": ObjectId(connection_id)})
    return conn_helper(updated)
