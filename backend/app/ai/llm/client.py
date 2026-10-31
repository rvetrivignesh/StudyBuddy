"""Single gateway to every LLM (local Ollama or hosted) through LiteLLM."""
import json
import logging
import os
import re
from typing import Any, TypeVar

os.environ.setdefault("LITELLM_LOCAL_MODEL_COST_MAP", "True")
import litellm
from pydantic import BaseModel, ValidationError

from app.ai.llm.registry import get_model
from app.core.config import settings
from app.core.errors import UpstreamError

logger = logging.getLogger(__name__)
litellm.drop_params = True  # silently drop params a provider doesn't support
litellm.suppress_debug_info = True

T = TypeVar("T", bound=BaseModel)

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)
_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def strip_think(text: str | None) -> str:
    return _THINK_RE.sub("", text or "").strip()


def extract_json(raw: str) -> Any:
    """Parse JSON from model output, tolerating <think> blocks, code fences and stray prose."""
    text = _FENCE_RE.sub("", strip_think(raw)).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


class LLMClient:
    def __init__(self) -> None:
        for env_name, value in (("GROQ_API_KEY", settings.groq_api_key), ("GEMINI_API_KEY", settings.gemini_api_key)):
            if value:
                os.environ[env_name] = value

    @staticmethod
    def _provider_kwargs(model: str) -> dict[str, Any]:
        if model.startswith("ollama"):
            return {"api_base": settings.ollama_base_url}
        return {}

    @staticmethod
    def _prepare(model: str, messages: list[dict]) -> list[dict]:
        if settings.disable_qwen_thinking and "qwen3" in model.lower() and messages and messages[0]["role"] == "system":
            first = {**messages[0], "content": f"{messages[0]['content']}\n/no_think"}
            return [first, *messages[1:]]
        return messages

    async def chat(
        self,
        task: str,
        messages: list[dict],
        *,
        tools: list[dict] | None = None,
        temperature: float = 0.3,
        json_mode: bool = False,
        max_tokens: int | None = None,
    ):
        """Raw completion; returns the assistant message (may contain tool_calls)."""
        model = get_model(task)
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": self._prepare(model, messages),
            "temperature": temperature,
            "timeout": settings.llm_timeout,
            "_skip_mcp_handler": True,
            **self._provider_kwargs(model),
        }
        if tools:
            kwargs["tools"] = tools
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        try:
            resp = await litellm.acompletion(**kwargs)
        except Exception as e:  # network down, model missing, rate limit...
            logger.exception("LLM call failed (task=%s model=%s)", task, model)
            raise UpstreamError(f"LLM call failed for task '{task}': {e}") from e
        return resp.choices[0].message

    async def text(self, task: str, system: str, user: str, *, temperature: float = 0.4) -> str:
        msg = await self.chat(task, [{"role": "system", "content": system}, {"role": "user", "content": user}], temperature=temperature)
        return strip_think(msg.content)

    async def structured(
        self,
        task: str,
        system: str,
        user: str,
        schema: type[T],
        *,
        temperature: float = 0.2,
        retries: int = 1,
    ) -> T:
        """Return a validated Pydantic object. Retries once, feeding the validation error back to the model."""
        schema_json = json.dumps(schema.model_json_schema())
        messages: list[dict] = [
            {
                "role": "system",
                "content": f"{system}\n\nRespond with ONLY one valid JSON object matching this JSON Schema. "
                f"No prose, no markdown fences.\nSchema: {schema_json}",
            },
            {"role": "user", "content": user},
        ]
        last_error: Exception | None = None
        for _ in range(retries + 1):
            msg = await self.chat(task, messages, temperature=temperature, json_mode=True)
            raw = msg.content or ""
            try:
                return schema.model_validate(extract_json(raw))
            except (ValueError, ValidationError) as e:
                last_error = e
                logger.warning("Invalid structured output (task=%s): %s", task, str(e)[:300])
                messages += [
                    {"role": "assistant", "content": raw},
                    {"role": "user", "content": f"That JSON was invalid: {str(e)[:500]}. Return corrected JSON only."},
                ]
        raise UpstreamError(f"Model returned invalid structured output for task '{task}': {last_error}")

    async def embed(self, texts: list[str]) -> list[list[float]]:
        model = get_model("embedding")
        try:
            resp = await litellm.aembedding(model=model, input=texts, **self._provider_kwargs(model))
        except Exception as e:
            logger.exception("Embedding call failed")
            raise UpstreamError(f"Embedding call failed: {e}") from e
        return [item["embedding"] if isinstance(item, dict) else item.embedding for item in resp.data]
