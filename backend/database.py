"""
MongoDB async connection via Motor.
Reads MONGODB_URL and DATABASE_NAME from environment variables.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "alumni_referral_platform")

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    """Create Motor client and connect to MongoDB."""
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    print(f"✅ Connected to MongoDB: {DATABASE_NAME}")


async def close_mongo_connection():
    """Close Motor client."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_database():
    """Return the database instance."""
    return db
