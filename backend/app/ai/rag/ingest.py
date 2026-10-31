"""parse -> chunk -> embed -> upsert. Runs as a FastAPI background task."""
import logging
import uuid

from starlette.concurrency import run_in_threadpool

from app.ai.container import get_llm_client, get_vector_store
from app.ai.rag.chunking import chunk_pages
from app.ai.rag.parsers import parse_file
from app.db.mongo import get_db
from app.db.repositories import DocumentRepository

logger = logging.getLogger(__name__)
EMBED_BATCH = 32


async def ingest_document(doc_id: str) -> None:
    repo = DocumentRepository(get_db())
    doc = await repo.get(doc_id)
    if not doc:
        return
    try:
        pages = await run_in_threadpool(parse_file, doc["path"])
        chunks = chunk_pages(pages)
        if not chunks:
            raise ValueError("No extractable text found (scanned PDF? add OCR support)")

        llm, store = get_llm_client(), get_vector_store()
        points: list[dict] = []
        for i in range(0, len(chunks), EMBED_BATCH):
            batch = chunks[i : i + EMBED_BATCH]
            vectors = await llm.embed([c.text for c in batch])
            for chunk, vector in zip(batch, vectors):
                points.append(
                    {
                        "id": str(uuid.uuid4()),
                        "vector": vector,
                        "payload": {
                            "user_id": doc["user_id"],
                            "subject_id": doc["subject_id"],
                            "doc_id": doc_id,
                            "filename": doc["filename"],
                            "page": chunk.page,
                            "text": chunk.text,
                        },
                    }
                )
        await store.upsert(points)
        await repo.update(doc_id, {"status": "ready", "chunk_count": len(points), "error": None})
        logger.info("Ingested %s (%d chunks)", doc["filename"], len(points))
    except Exception as e:
        logger.exception("Ingestion failed for %s", doc_id)
        await repo.update(doc_id, {"status": "failed", "error": str(e)[:500]})
