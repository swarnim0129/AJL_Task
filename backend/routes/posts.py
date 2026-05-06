"""Posts API routes — Feed, create, like, comment, save."""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional
import uuid

from database import get_database
from models.post import PostCreate, CommentCreate

router = APIRouter()


def post_helper(post: dict) -> dict:
    """Convert MongoDB post document to response dict."""
    return {
        "id": str(post["_id"]),
        "author_id": post.get("author_id", ""),
        "author_name": post.get("author_name", ""),
        "author_avatar": post.get("author_avatar"),
        "author_role": post.get("author_role", ""),
        "author_company": post.get("author_company"),
        "type": post.get("type", "guidance"),
        "title": post.get("title", ""),
        "content": post.get("content", ""),
        "company": post.get("company"),
        "job_link": post.get("job_link"),
        "location": post.get("location"),
        "tags": post.get("tags", []),
        "likes": post.get("likes", []),
        "comments": post.get("comments", []),
        "saved_by": post.get("saved_by", []),
        "like_count": len(post.get("likes", [])),
        "comment_count": len(post.get("comments", [])),
        "created_at": post.get("created_at", datetime.utcnow()),
        "updated_at": post.get("updated_at", datetime.utcnow()),
    }


@router.get("/")
async def list_posts(
    post_type: Optional[str] = None,
    author_id: Optional[str] = None,
    limit: int = Query(default=20, le=50),
    skip: int = 0,
):
    """List posts in reverse chronological order, with optional filters."""
    db = get_database()
    query = {}
    if post_type:
        query["type"] = post_type
    if author_id:
        query["author_id"] = author_id

    posts = []
    cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    async for post in cursor:
        posts.append(post_helper(post))
    return posts


@router.get("/saved/{user_id}")
async def get_saved_posts(user_id: str):
    """Get posts saved by a specific user."""
    db = get_database()
    posts = []
    async for post in db.posts.find({"saved_by": user_id}).sort("created_at", -1):
        posts.append(post_helper(post))
    return posts


@router.get("/{post_id}")
async def get_post(post_id: str):
    """Get a specific post by ID."""
    db = get_database()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post_helper(post)


@router.post("/")
async def create_post(post: PostCreate, author_id: str = Query(...)):
    """Create a new post. Only alumni can post."""
    db = get_database()
    author = await db.users.find_one({"_id": ObjectId(author_id)})
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    if author.get("role") not in ["alumni", "admin"]:
        raise HTTPException(status_code=403, detail="Only alumni can create posts")

    post_dict = post.model_dump()
    post_dict["author_id"] = author_id
    post_dict["author_name"] = author["name"]
    post_dict["author_avatar"] = author.get("avatar_url")
    post_dict["author_role"] = author["role"]
    post_dict["author_company"] = author.get("company")
    post_dict["likes"] = []
    post_dict["comments"] = []
    post_dict["saved_by"] = []
    post_dict["created_at"] = datetime.utcnow()
    post_dict["updated_at"] = datetime.utcnow()

    result = await db.posts.insert_one(post_dict)
    created_post = await db.posts.find_one({"_id": result.inserted_id})
    return post_helper(created_post)


@router.post("/{post_id}/like")
async def toggle_like(post_id: str, user_id: str = Query(...)):
    """Toggle like on a post."""
    db = get_database()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    likes = post.get("likes", [])
    if user_id in likes:
        likes.remove(user_id)
        action = "unliked"
    else:
        likes.append(user_id)
        action = "liked"

    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {"likes": likes, "updated_at": datetime.utcnow()}}
    )
    return {"action": action, "like_count": len(likes)}


@router.post("/{post_id}/comment")
async def add_comment(post_id: str, comment: CommentCreate, user_id: str = Query(...)):
    """Add a comment to a post."""
    db = get_database()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    comment_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user["name"],
        "user_avatar": user.get("avatar_url"),
        "content": comment.content,
        "created_at": datetime.utcnow(),
    }

    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {
            "$push": {"comments": comment_doc},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return post_helper(updated_post)


@router.post("/{post_id}/save")
async def toggle_save(post_id: str, user_id: str = Query(...)):
    """Toggle save on a post."""
    db = get_database()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    saved_by = post.get("saved_by", [])
    if user_id in saved_by:
        saved_by.remove(user_id)
        action = "unsaved"
    else:
        saved_by.append(user_id)
        action = "saved"

    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {"saved_by": saved_by, "updated_at": datetime.utcnow()}}
    )
    return {"action": action}


@router.delete("/{post_id}")
async def delete_post(post_id: str):
    """Delete a post (admin or author)."""
    db = get_database()
    result = await db.posts.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}
