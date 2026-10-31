import logging

from app.ai.agents.syllabus import SyllabusAgent
from app.ai.container import get_llm_client
from app.core.errors import NotFoundError
from app.db.mongo import get_db
from app.db.repositories import SubjectRepository
from app.schemas.subject import SubjectCreate, SubjectUpdate
from app.services.document_service import DocumentService

logger = logging.getLogger(__name__)

# collections holding per-subject data, purged when a subject is deleted
_SUBJECT_COLLECTIONS = ("plans", "quizzes", "recall_attempts", "flashcard_sets", "deep_dives", "conversations")


class SubjectService:
    def __init__(self, db):
        self.db = db
        self.repo = SubjectRepository(db)

    async def create(self, user_id: str, body: SubjectCreate) -> dict:
        data = body.model_dump(mode="json")  # dates -> ISO strings (BSON has no `date`)
        return await self.repo.insert({**data, "user_id": user_id, "topics": [], "topics_status": "pending"})

    async def get_owned(self, user_id: str, subject_id: str) -> dict:
        subject = await self.repo.get(subject_id, user_id=user_id)
        if not subject:
            raise NotFoundError("Subject not found")
        return subject

    async def list(self, user_id: str) -> list[dict]:
        return await self.repo.list({"user_id": user_id})

    async def update(self, user_id: str, subject_id: str, body: SubjectUpdate) -> tuple[dict, bool]:
        await self.get_owned(user_id, subject_id)
        patch = body.model_dump(mode="json", exclude_unset=True)
        syllabus_changed = "syllabus" in patch
        if syllabus_changed:
            patch["topics_status"] = "pending"
        doc = await self.repo.update(subject_id, patch, user_id=user_id)
        return doc, syllabus_changed  # type: ignore[return-value]

    async def mark_pending(self, subject_id: str) -> None:
        await self.repo.update(subject_id, {"topics_status": "pending"})

    async def delete(self, user_id: str, subject_id: str) -> None:
        await self.get_owned(user_id, subject_id)
        await DocumentService(self.db).delete_all(user_id, subject_id)
        for name in _SUBJECT_COLLECTIONS:
            await self.db[name].delete_many({"user_id": user_id, "subject_id": subject_id})
        await self.repo.delete(subject_id, user_id=user_id)


async def parse_syllabus_task(subject_id: str) -> None:
    """Background task: syllabus text -> topic tree."""
    repo = SubjectRepository(get_db())
    subject = await repo.get(subject_id)
    if not subject:
        return
    try:
        topics = await SyllabusAgent(get_llm_client()).parse(subject["syllabus"])
        await repo.update(subject_id, {"topics": [t.model_dump() for t in topics], "topics_status": "ready"})
    except Exception:
        logger.exception("Syllabus parsing failed for %s", subject_id)
        await repo.update(subject_id, {"topics_status": "failed"})
