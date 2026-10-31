"""Qdrant wrapper. Swap this file to change vector DB; nothing else depends on Qdrant."""
import logging
from dataclasses import dataclass

from qdrant_client import AsyncQdrantClient, models

from app.core.config import settings
from app.core.errors import UpstreamError

logger = logging.getLogger(__name__)


@dataclass
class Hit:
    score: float
    payload: dict


class VectorStore:
    def __init__(self) -> None:
        self.client = AsyncQdrantClient(url=settings.qdrant_url)
        self.collection = settings.qdrant_collection
        self._ready = False

    async def ensure_collection(self) -> None:
        if self._ready:
            return
        if not await self.client.collection_exists(self.collection):
            await self.client.create_collection(
                self.collection,
                vectors_config=models.VectorParams(size=settings.embedding_dim, distance=models.Distance.COSINE),
            )
        for field in ("user_id", "subject_id", "doc_id"):
            await self.client.create_payload_index(self.collection, field, models.PayloadSchemaType.KEYWORD)
        self._ready = True

    async def upsert(self, points: list[dict]) -> None:
        """points: [{"id": str(uuid), "vector": [...], "payload": {...}}]"""
        try:
            await self.ensure_collection()
            await self.client.upsert(
                self.collection,
                points=[models.PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"]) for p in points],
            )
        except Exception as e:
            raise UpstreamError(f"Vector store error: {e}") from e

    async def search(self, vector: list[float], *, user_id: str, subject_id: str, k: int = 5) -> list[Hit]:
        flt = models.Filter(
            must=[
                models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)),
                models.FieldCondition(key="subject_id", match=models.MatchValue(value=subject_id)),
            ]
        )
        try:
            await self.ensure_collection()
            res = await self.client.query_points(self.collection, query=vector, query_filter=flt, limit=k, with_payload=True)
        except Exception as e:
            raise UpstreamError(f"Vector store error: {e}") from e
        return [Hit(score=p.score, payload=p.payload or {}) for p in res.points]

    async def delete_where(self, **match: str) -> None:
        flt = models.Filter(must=[models.FieldCondition(key=k, match=models.MatchValue(value=v)) for k, v in match.items()])
        try:
            await self.ensure_collection()
            await self.client.delete(self.collection, points_selector=models.FilterSelector(filter=flt))
        except Exception:
            logger.exception("Failed to delete vectors for %s", match)
