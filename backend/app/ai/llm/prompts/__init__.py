from functools import lru_cache
from pathlib import Path
from string import Template

_DIR = Path(__file__).parent


@lru_cache
def _read(name: str) -> str:
    return (_DIR / f"{name}.md").read_text(encoding="utf-8")


def load_prompt(name: str, **variables: str) -> str:
    """Load app/ai/llm/prompts/<name>.md and substitute $variables."""
    return Template(_read(name)).safe_substitute(**variables)
