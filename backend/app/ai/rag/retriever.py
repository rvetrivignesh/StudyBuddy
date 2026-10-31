from dataclasses import dataclass

from app.ai.llm.client import LLMClient
from app.ai.rag.vectorstore import VectorStore
from app.schemas.chat import Source


@dataclass
class RetrievedChunk:
    text: str
    filename: str
    page: int | None
    doc_id: str
    score: float

    def to_source(self) -> Source:
        return Source(
            title=self.filename,
            location=f"p.{self.page}" if self.page else None,
            snippet=self.text[:200],
        )


class Retriever:
    """Every agent retrieves through this class, always scoped to (user, subject).

    Extension points: hybrid BM25 + vector search, cross-encoder reranking (e.g. bge-reranker).
    """

    def __init__(self, llm: LLMClient, store: VectorStore) -> None:
        self.llm = llm
        self.store = store

    async def search(
        self, query: str, *, user_id: str, subject_id: str, k: int = 5, min_score: float = 0.3
    ) -> list[RetrievedChunk]:
        [vector] = await self.llm.embed([query])
        hits = await self.store.search(vector, user_id=user_id, subject_id=subject_id, k=k)
        return [
            RetrievedChunk(
                text=h.payload.get("text", ""),
                filename=h.payload.get("filename", "document"),
                page=h.payload.get("page"),
                doc_id=h.payload.get("doc_id", ""),
                score=h.score,
            )
            for h in hits
            if h.score >= min_score
        ]


def format_context(chunks: list[RetrievedChunk]) -> str:
    """Numbered passages the model can cite as [1], [2]..."""
    return "\n\n".join(
        f"[{i}] ({c.filename}{', p.' + str(c.page) if c.page else ''})\n{c.text}" for i, c in enumerate(chunks, start=1)
    )
