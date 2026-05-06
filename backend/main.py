"""
Alumni-Student Referral Platform — FastAPI Backend
Main application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import connect_to_mongo, close_mongo_connection
from routes.users import router as users_router
from routes.posts import router as posts_router
from routes.referrals import router as referrals_router
from routes.connections import router as connections_router
from routes.messages import router as messages_router
from routes.notifications import router as notifications_router
from routes.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Alumni-Student Referral Platform",
    description="API for connecting DJ Sanghvi alumni with students for referrals and mentorship",
    version="1.0.0",
    lifespan=lifespan,
)

import os

frontend_urls = os.getenv("FRONTEND_URLS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(posts_router, prefix="/api/posts", tags=["Posts"])
app.include_router(referrals_router, prefix="/api/referrals", tags=["Referrals"])
app.include_router(connections_router, prefix="/api/connections", tags=["Connections"])
app.include_router(messages_router, prefix="/api/messages", tags=["Messages"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {"message": "Alumni-Student Referral Platform API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
