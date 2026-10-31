import tempfile
from pathlib import Path

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.ai.agents.resume import ResumeAnalyzerAgent, ResumeParserAgent
from app.ai.container import get_llm_client
from app.ai.rag.parsers import extract_text
from app.core.errors import NotFoundError, ValidationFailed
from app.db.repositories import ResumeAnalysisRepository, ResumeRepository
from app.db.repository import utcnow
from app.schemas.resume import ResumeData, ResumeUpdate

RESUME_EXTENSIONS = {".pdf", ".docx", ".txt"}


class ResumeService:
    def __init__(self, db):
        self.repo = ResumeRepository(db)
        self.analyses = ResumeAnalysisRepository(db)

    async def upload(self, user_id: str, file: UploadFile) -> dict:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in RESUME_EXTENSIONS:
            raise ValidationFailed(f"Unsupported resume type '{ext}'. Use PDF, DOCX or TXT.")
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise ValidationFailed("Resume file too large (max 10 MB)")
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(content)
            path = tmp.name
        try:
            text = await run_in_threadpool(extract_text, path)
        finally:
            Path(path).unlink(missing_ok=True)  # raw resume is never kept on disk
        if len(text.strip()) < 50:
            raise ValidationFailed("Could not read text from this file (scanned PDF?). Use the form instead.")
        data = await ResumeParserAgent(get_llm_client()).parse(text)
        return await self.save(user_id, data, source="upload")

    async def save(self, user_id: str, data: ResumeData, source: str = "form") -> dict:
        """Create or fully replace the user's resume (form submit / parsed upload)."""
        return await self.repo.upsert({"user_id": user_id}, {**data.model_dump(mode="json"), "source": source})

    async def patch(self, user_id: str, body: ResumeUpdate) -> dict:
        patch = body.model_dump(mode="json", exclude_unset=True)
        if not patch:
            return await self.get(user_id)
        doc = await self.repo.update_where({"user_id": user_id}, patch)
        if not doc:
            raise NotFoundError("No resume yet. Upload one or submit the form first.")
        return doc

    async def get(self, user_id: str) -> dict:
        doc = await self.repo.find_one({"user_id": user_id})
        if not doc:
            raise NotFoundError("No resume yet. Upload one or submit the form first.")
        return doc

    async def analyze(self, user_id: str, job_description: str | None) -> dict:
        resume = await self.get(user_id)
        content = {k: v for k, v in resume.items() if k not in {"id", "user_id", "created_at", "updated_at", "source"}}
        result = await ResumeAnalyzerAgent(get_llm_client()).analyze(content, job_description)
        return await self.analyses.upsert({"user_id": user_id}, {**result.model_dump(), "analyzed_at": utcnow()})

    async def latest_analysis(self, user_id: str) -> dict:
        doc = await self.analyses.find_one({"user_id": user_id})
        if not doc:
            raise NotFoundError("No analysis yet. Run /resume/analyze first.")
        return doc
