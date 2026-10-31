from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Education(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_year: str | None = None
    end_year: str | None = None
    grade: str | None = None


class Experience(BaseModel):
    company: str
    title: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    current: bool = False
    highlights: list[str] = []


class Project(BaseModel):
    name: str
    description: str | None = None
    tech: list[str] = []
    link: str | None = None


class Certification(BaseModel):
    name: str
    issuer: str | None = None
    year: str | None = None


class ResumeData(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None
    summary: str | None = None
    skills: list[str] = []
    education: list[Education] = []
    experience: list[Experience] = []
    projects: list[Project] = []
    certifications: list[Certification] = []
    languages: list[str] = []


class ResumeUpdate(BaseModel):
    """Field-level live edit: only fields that are sent are changed (lists are replaced whole)."""

    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None
    summary: str | None = None
    skills: list[str] | None = None
    education: list[Education] | None = None
    experience: list[Experience] | None = None
    projects: list[Project] | None = None
    certifications: list[Certification] | None = None
    languages: list[str] | None = None


class ResumeOut(ResumeData):
    id: str
    source: Literal["upload", "form"] = "form"
    updated_at: datetime | None = None


class AnalyzeRequest(BaseModel):
    job_description: str | None = None


class ResumeAnalysisContent(BaseModel):
    """LLM output schema."""

    score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
    ats_issues: list[str] = []
    missing_keywords: list[str] = []


class ResumeAnalysis(ResumeAnalysisContent):
    analyzed_at: datetime | None = None
