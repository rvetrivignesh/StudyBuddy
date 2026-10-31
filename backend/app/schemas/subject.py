from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

Pace = Literal["fast", "medium", "slow"]
Weekday = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


class Topic(BaseModel):
    title: str
    subtopics: list[str] = []
    weight: int = Field(3, ge=1, le=5)


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    syllabus: str = Field(min_length=10)
    time_frame_weeks: int = Field(ge=1, le=104, description="Suitable time frame to learn the subject")
    days_per_week: int = Field(ge=1, le=7)
    study_days: list[Weekday] | None = Field(None, description="Optional explicit weekdays; defaults are spread automatically")
    pace: Pace = "medium"
    exam_date: date | None = None


class SubjectUpdate(BaseModel):
    name: str | None = None
    syllabus: str | None = None
    time_frame_weeks: int | None = Field(None, ge=1, le=104)
    days_per_week: int | None = Field(None, ge=1, le=7)
    study_days: list[Weekday] | None = None
    pace: Pace | None = None
    exam_date: date | None = None


class SubjectOut(SubjectCreate):
    id: str
    topics: list[Topic] = []
    topics_status: Literal["pending", "ready", "failed"] = "pending"
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TopicTree(BaseModel):
    """LLM output schema for syllabus parsing."""

    topics: list[Topic]
