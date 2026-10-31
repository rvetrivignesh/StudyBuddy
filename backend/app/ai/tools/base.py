import json
import logging
from dataclasses import dataclass, field
from typing import Awaitable, Callable

from pydantic import BaseModel, ValidationError

from app.ai.rag.retriever import Retriever
from app.schemas.chat import Source

logger = logging.getLogger(__name__)


@dataclass
class ToolContext:
    """Per-request context passed to every tool call."""

    user_id: str
    subject_id: str | None
    retriever: Retriever
    sources: list[Source] = field(default_factory=list)


@dataclass
class Tool:
    name: str
    description: str
    args_model: type[BaseModel]
    handler: Callable[[ToolContext, BaseModel], Awaitable[str]]

    def spec(self) -> dict:
        """OpenAI-style function spec understood by LiteLLM / Ollama."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.args_model.model_json_schema(),
            },
        }

    async def run(self, ctx: ToolContext, raw_args: str | dict) -> str:
        try:
            data = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            args = self.args_model.model_validate(data or {})
        except (ValueError, ValidationError) as e:
            return f"Invalid arguments for {self.name}: {e}"  # let the model retry
        try:
            return await self.handler(ctx, args)
        except Exception as e:
            logger.exception("Tool %s failed", self.name)
            return f"Tool {self.name} failed: {e}"
