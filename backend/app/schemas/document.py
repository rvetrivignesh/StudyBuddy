from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    subject_id: str
    filename: str
    size: int = 0
    status: Literal["processing", "ready", "failed"]
    chunk_count: int = 0
    error: str | None = None
    created_at: datetime | None = None
