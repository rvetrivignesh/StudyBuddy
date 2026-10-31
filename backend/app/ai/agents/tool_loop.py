"""Generic tool-calling loop: model -> tool calls -> tool results -> model ... -> final answer."""
import logging

from app.ai.llm.client import LLMClient, strip_think
from app.ai.tools.base import Tool, ToolContext

logger = logging.getLogger(__name__)


async def run_tool_loop(
    llm: LLMClient,
    task: str,
    messages: list[dict],
    tools: list[Tool],
    ctx: ToolContext,
    *,
    max_steps: int = 5,
) -> str:
    specs = [t.spec() for t in tools]
    by_name = {t.name: t for t in tools}

    for _ in range(max_steps):
        msg = await llm.chat(task, messages, tools=specs or None)
        calls = getattr(msg, "tool_calls", None)
        if not calls:
            return strip_think(msg.content)

        messages.append(
            {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {"id": c.id, "type": "function", "function": {"name": c.function.name, "arguments": c.function.arguments}}
                    for c in calls
                ],
            }
        )
        for c in calls:
            tool = by_name.get(c.function.name)
            logger.info("tool call: %s(%s)", c.function.name, c.function.arguments)
            result = await tool.run(ctx, c.function.arguments) if tool else f"Unknown tool: {c.function.name}"
            messages.append({"role": "tool", "tool_call_id": c.id, "name": c.function.name, "content": result})

    # Step budget exhausted: force a final answer without tools.
    messages.append({"role": "user", "content": "Answer now using the information gathered so far."})
    msg = await llm.chat(task, messages)
    return strip_think(msg.content)
