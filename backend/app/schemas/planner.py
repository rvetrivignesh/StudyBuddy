from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    exam_date: date | None = Field(None, description="Falls back to the subject's exam_date, then start + time frame")
    start_date: date | None = None
    session_start: str = Field("18:00", pattern=r"^\d{2}:\d{2}$")
    use_ai_weights: bool = True


class PlanEvent(BaseModel):
    date: date
    start: datetime
    end: datetime
    title: str
    topic: str
    kind: Literal["learn", "revise", "mock"]
    description: str = ""


class PlanOut(BaseModel):
    id: str
    subject_id: str
    start_date: date
    exam_date: date
    events: list[PlanEvent]
    warnings: list[str] = []


class TopicWeight(BaseModel):
    title: str
    weight: int = Field(ge=1, le=5)


class TopicWeights(BaseModel):
    """LLM output schema."""

    weights: list[TopicWeight]
