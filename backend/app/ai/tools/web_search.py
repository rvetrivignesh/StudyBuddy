from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.ai.tools.base import Tool, ToolContext
from app.schemas.chat import Source


class WebSearchArgs(BaseModel):
    query: str = Field(description="Search query for finding explanations or learning resources")
    max_results: int = Field(5, ge=1, le=8)


def _search(query: str, n: int) -> list[dict]:
    try:
        from ddgs import DDGS
    except ImportError:  # older package name
        from duckduckgo_search import DDGS  # type: ignore
    return list(DDGS().text(query, max_results=n))


async def _handler(ctx: ToolContext, args: WebSearchArgs) -> str:  # type: ignore[override]
    results = await run_in_threadpool(_search, args.query, args.max_results)
    if not results:
        return "No web results found."
    lines = []
    for r in results:
        title, url, body = r.get("title", ""), r.get("href", ""), r.get("body", "")
        ctx.sources.append(Source(title=title, url=url, snippet=body[:200]))
        lines.append(f"- {title}\n  {url}\n  {body}")
    return "\n".join(lines)


web_search_tool = Tool(
    name="web_search",
    description="Search the web for explanations, articles, videos or other learning resources.",
    args_model=WebSearchArgs,
    handler=_handler,  # type: ignore[arg-type]
)
