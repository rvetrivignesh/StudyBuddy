from app.ai.llm.client import LLMClient
from app.ai.rag.retriever import Retriever, RetrievedChunk, format_context
from app.schemas.chat import Source


class BaseAgent:
    def __init__(self, llm: LLMClient, retriever: Retriever | None = None) -> None:
        self.llm = llm
        self.retriever = retriever

    async def ground(
        self, query: str, *, user_id: str, subject_id: str, k: int = 6
    ) -> tuple[str, list[RetrievedChunk], list[Source]]:
        """RAG helper: returns (context_text, chunks, sources). Empty context if nothing relevant."""
        if not self.retriever:
            return "", [], []
        chunks = await self.retriever.search(query, user_id=user_id, subject_id=subject_id, k=k)
        return format_context(chunks), chunks, [c.to_source() for c in chunks]


def material_block(context: str) -> str:
    return f"STUDY MATERIAL:\n{context}" if context else "STUDY MATERIAL: (none uploaded - use well-established general knowledge)"
