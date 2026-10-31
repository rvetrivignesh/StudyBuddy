"""Maps a *task* to a model. Features ask for tasks, never for model names,
so moving a task from local Ollama to a hosted API is a one-line .env change."""
from app.core.config import settings

TASKS = (
    "chat",
    "deep_learning",
    "flashcards",
    "recall_mcq",
    "grading",
    "planner",
    "syllabus",
    "resume_parse",
    "resume_analyze",
    "embedding",
)


def get_model(task: str) -> str:
    if task not in TASKS:
        raise KeyError(f"Unknown LLM task: {task}")
    return getattr(settings, f"model_{task}")
