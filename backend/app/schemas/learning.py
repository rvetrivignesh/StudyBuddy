from pydantic import BaseModel, Field

from app.schemas.chat import Source


class TopicRequest(BaseModel):
    subject_id: str
    topic: str = Field(min_length=1, max_length=200)
    refresh: bool = Field(False, description="Ignore the cache and regenerate")


class FlashcardRequest(TopicRequest):
    count: int = Field(10, ge=3, le=25)


class Flashcard(BaseModel):
    front: str = Field(description="A short question, term, or hook")
    back: str = Field(description="A simple 1-3 sentence explanation")


class FlashcardSetContent(BaseModel):
    cards: list[Flashcard]


class FlashcardSet(FlashcardSetContent):
    topic: str


class KeyConcept(BaseModel):
    name: str
    explanation: str


class DeepDiveContent(BaseModel):
    """LLM output schema."""

    overview: str
    intuition: str
    key_concepts: list[KeyConcept]
    worked_example: str
    common_mistakes: list[str]
    summary: str
    further_study: list[str] = []


class DeepDive(DeepDiveContent):
    topic: str
    grounded: bool = Field(description="True when built from the user's uploaded material")
    sources: list[Source] = []
