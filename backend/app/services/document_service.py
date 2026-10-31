import logging
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.ai.container import get_vector_store
from app.ai.rag.parsers import SUPPORTED_EXTENSIONS
from app.core.config import settings
from app.core.errors import NotFoundError, ValidationFailed
from app.db.repositories import DocumentRepository, SubjectRepository

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self, db):
        self.repo = DocumentRepository(db)
        self.subjects = SubjectRepository(db)

    async def _ensure_subject(self, user_id: str, subject_id: str) -> None:
        if not await self.subjects.get(subject_id, user_id=user_id):
            raise NotFoundError("Subject not found")

    async def upload(self, user_id: str, subject_id: str, file: UploadFile) -> dict:
        await self._ensure_subject(user_id, subject_id)
        filename = Path(file.filename or "upload").name
        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValidationFailed(f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
        content = await file.read()
        if not content:
            raise ValidationFailed("The file is empty")
        if len(content) > settings.max_upload_mb * 1024 * 1024:
            raise ValidationFailed(f"File too large (max {settings.max_upload_mb} MB)")

        dest = Path(settings.upload_dir) / user_id / subject_id
        dest.mkdir(parents=True, exist_ok=True)
        path = dest / f"{uuid4().hex}{ext}"
        await run_in_threadpool(path.write_bytes, content)
        return await self.repo.insert(
            {
                "user_id": user_id,
                "subject_id": subject_id,
                "filename": filename,
                "path": str(path),
                "size": len(content),
                "status": "processing",
                "chunk_count": 0,
                "error": None,
            }
        )

    async def list(self, user_id: str, subject_id: str) -> list[dict]:
        await self._ensure_subject(user_id, subject_id)
        return await self.repo.list({"user_id": user_id, "subject_id": subject_id})

    async def get(self, user_id: str, subject_id: str, doc_id: str) -> dict:
        doc = await self.repo.get(doc_id, user_id=user_id, subject_id=subject_id)
        if not doc:
            raise NotFoundError("Document not found")
        return doc

    async def delete(self, user_id: str, subject_id: str, doc_id: str) -> None:
        doc = await self.get(user_id, subject_id, doc_id)
        await self._purge(doc)

    async def delete_all(self, user_id: str, subject_id: str) -> None:
        for doc in await self.repo.list({"user_id": user_id, "subject_id": subject_id}, limit=1000):
            await self._purge(doc)

    async def _purge(self, doc: dict) -> None:
        await get_vector_store().delete_where(doc_id=doc["id"])
        Path(doc["path"]).unlink(missing_ok=True)
        await self.repo.delete(doc["id"])
