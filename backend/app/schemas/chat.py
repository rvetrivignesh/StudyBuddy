from pydantic import BaseModel, Field


class Source(BaseModel):
    title: str
    location: str | None = None
    snippet: str | None = None
    url: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    subject_id: str | None = Field(None, description="Set to ground answers in this subject's uploaded material")
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    sources: list[Source] = []
