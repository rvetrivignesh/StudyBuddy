from app.ai.agents.base import BaseAgent
from app.ai.agents.tool_loop import run_tool_loop
from app.ai.llm.prompts import load_prompt
from app.ai.tools.base import ToolContext
from app.ai.tools.registry import get_tools
from app.schemas.chat import Source


class ChatAgent(BaseAgent):
    async def reply(
        self, *, user_id: str, subject: dict | None, history: list[dict], message: str
    ) -> tuple[str, list[Source]]:
        tool_names = ["retrieve_notes", "web_search"] if subject else ["web_search"]
        ctx = ToolContext(user_id=user_id, subject_id=subject["id"] if subject else None, retriever=self.retriever)  # type: ignore[arg-type]
        system = load_prompt("chat", subject_name=subject["name"] if subject else "General (no subject selected)")
        messages = [{"role": "system", "content": system}, *history[-10:], {"role": "user", "content": message}]
        text = await run_tool_loop(self.llm, "chat", messages, get_tools(tool_names), ctx)
        # de-duplicate sources
        seen, sources = set(), []
        for s in ctx.sources:
            key = (s.title, s.location, s.url)
            if key not in seen:
                seen.add(key)
                sources.append(s)
        return text, sources
