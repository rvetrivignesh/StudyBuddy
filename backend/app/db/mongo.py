import logging

from pymongo import ASCENDING, AsyncMongoClient

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncMongoClient | None = None


def connect() -> None:
    global _client
    _client = AsyncMongoClient(settings.mongo_uri, tz_aware=True)


async def close() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None


def get_db():
    if _client is None:
        connect()
    return _client[settings.mongo_db]  # type: ignore[index]


async def ping() -> bool:
    try:
        await get_db().command("ping")
        return True
    except Exception:
        return False


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.subjects.create_index([("user_id", ASCENDING)])
    await db.documents.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING)])
    await db.plans.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING)], unique=True)
    await db.resumes.create_index("user_id", unique=True)
    await db.resume_analyses.create_index("user_id", unique=True)
    await db.conversations.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING)])
    await db.flashcard_sets.create_index(
        [("user_id", ASCENDING), ("subject_id", ASCENDING), ("topic_key", ASCENDING)], unique=True
    )
    await db.deep_dives.create_index(
        [("user_id", ASCENDING), ("subject_id", ASCENDING), ("topic_key", ASCENDING)], unique=True
    )
    await db.quizzes.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING)])
    await db.recall_attempts.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING)])
    logger.info("MongoDB indexes ensured")
