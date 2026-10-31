from pydantic import BaseModel, Field

from app.ai.rag.retriever import format_context
from app.ai.tools.base import Tool, ToolContext


class RetrieveNotesArgs(BaseModel):
    query: str = Field(description="What to look for in the student's uploaded study material")
    k: int = Field(5, ge=1, le=10)


async def _handler(ctx: ToolContext, args: RetrieveNotesArgs) -> str:  # type: ignore[override]
    if not ctx.subject_id:
        return "No subject is selected, so there are no uploaded notes to search."
    chunks = await ctx.retriever.search(args.query, user_id=ctx.user_id, subject_id=ctx.subject_id, k=args.k)
    if not chunks:
        return "No relevant passages found in the uploaded material."
    ctx.sources.extend(c.to_source() for c in chunks)
    return format_context(chunks)


retrieve_notes_tool = Tool(
    name="retrieve_notes",
    description="Search the student's uploaded study material for passages relevant to a query.",
    args_model=RetrieveNotesArgs,
    handler=_handler,  # type: ignore[arg-type]
)
