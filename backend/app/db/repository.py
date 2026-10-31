"""Thin generic repository over a Mongo collection.

Documents are returned as plain dicts with `_id` replaced by a string `id`.
Foreign keys (user_id, subject_id...) are stored as strings.
"""
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from app.core.errors import NotFoundError


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise NotFoundError("Resource not found")


def serialize(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


class Repository:
    collection: str = ""

    def __init__(self, db):
        self.col = db[self.collection]

    async def insert(self, data: dict[str, Any]) -> dict:
        now = utcnow()
        doc = {**data, "created_at": now, "updated_at": now}
        res = await self.col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return serialize(doc)  # type: ignore[return-value]

    async def get(self, id: str, **filters) -> dict | None:
        return serialize(await self.col.find_one({"_id": to_oid(id), **filters}))

    async def find_one(self, filters: dict) -> dict | None:
        return serialize(await self.col.find_one(filters))

    async def list(self, filters: dict | None = None, *, sort=None, limit: int = 200, skip: int = 0) -> list[dict]:
        cursor = self.col.find(filters or {}, sort=sort or [("created_at", -1)], limit=limit, skip=skip)
        return [serialize(d) async for d in cursor]  # type: ignore[misc]

    async def update_where(self, filters: dict, patch: dict[str, Any]) -> dict | None:
        doc = await self.col.find_one_and_update(
            filters,
            {"$set": {**patch, "updated_at": utcnow()}},
            return_document=ReturnDocument.AFTER,
        )
        return serialize(doc)

    async def update(self, id: str, patch: dict[str, Any], **filters) -> dict | None:
        return await self.update_where({"_id": to_oid(id), **filters}, patch)

    async def upsert(self, filters: dict, data: dict[str, Any]) -> dict:
        now = utcnow()
        await self.col.update_one(
            filters,
            {"$set": {**data, "updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        return await self.find_one(filters)  # type: ignore[return-value]

    async def delete(self, id: str, **filters) -> bool:
        res = await self.col.delete_one({"_id": to_oid(id), **filters})
        return res.deleted_count == 1

    async def delete_where(self, filters: dict) -> int:
        res = await self.col.delete_many(filters)
        return res.deleted_count
