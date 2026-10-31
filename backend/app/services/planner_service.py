import logging
from datetime import date, timedelta

from app.ai.agents.planner import PlannerAgent
from app.ai.container import get_llm_client
from app.core.errors import NotFoundError, ValidationFailed
from app.db.repositories import PlanRepository
from app.schemas.planner import PlanRequest
from app.schemas.subject import Topic
from app.services.calendar_export import plan_to_ics
from app.services.scheduling import PlanningError, TopicInput, build_plan
from app.services.subject_service import SubjectService

logger = logging.getLogger(__name__)


class PlannerService:
    def __init__(self, db):
        self.subjects = SubjectService(db)
        self.plans = PlanRepository(db)

    async def generate(self, user_id: str, subject_id: str, req: PlanRequest) -> dict:
        subject = await self.subjects.get_owned(user_id, subject_id)
        if subject.get("topics_status") != "ready" or not subject["topics"]:
            raise ValidationFailed(f"Syllabus topics are not ready (status: {subject.get('topics_status')}). Try again shortly.")

        start = req.start_date or date.today()
        exam = req.exam_date or (date.fromisoformat(subject["exam_date"]) if subject.get("exam_date") else None)
        exam = exam or start + timedelta(weeks=subject["time_frame_weeks"])

        topics = [Topic(**t) for t in subject["topics"]]
        warnings: list[str] = []
        if req.use_ai_weights:
            try:
                topics = await PlannerAgent(get_llm_client()).weight_topics(subject["name"], topics, subject["pace"])
            except Exception:
                logger.exception("AI topic weighting failed; using default weights")
                warnings.append("AI topic weighting was unavailable; all topics were given equal effort.")

        try:
            events, plan_warnings = build_plan(
                [TopicInput(t.title, t.weight, t.subtopics) for t in topics],
                start=start,
                exam=exam,
                days_per_week=subject["days_per_week"],
                study_days=subject.get("study_days"),
                pace=subject["pace"],
                session_start=req.session_start,
            )
        except PlanningError as e:
            raise ValidationFailed(str(e)) from e

        return await self.plans.upsert(
            {"user_id": user_id, "subject_id": subject_id},
            {"start_date": start.isoformat(), "exam_date": exam.isoformat(), "events": events, "warnings": warnings + plan_warnings},
        )

    async def get(self, user_id: str, subject_id: str) -> dict:
        await self.subjects.get_owned(user_id, subject_id)
        plan = await self.plans.find_one({"user_id": user_id, "subject_id": subject_id})
        if not plan:
            raise NotFoundError("No plan yet. Generate one first.")
        return plan

    async def ics(self, user_id: str, subject_id: str) -> str:
        subject = await self.subjects.get_owned(user_id, subject_id)
        plan = await self.get(user_id, subject_id)
        return plan_to_ics(plan["events"], calendar_name=f"Study plan: {subject['name']}", plan_id=plan["id"])
