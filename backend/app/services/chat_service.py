from app.ai.agents.chatbot import ChatAgent
from app.ai.container import get_llm_client, get_retriever
from app.core.errors import NotFoundError
from app.db.repositories import ConversationRepository
from app.db.repository import to_oid, utcnow
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.subject_service import SubjectService


class ChatService:
    def __init__(self, db):
        self.subjects = SubjectService(db)
        self.repo = ConversationRepository(db)

    async def send(self, user_id: str, req: ChatRequest) -> ChatResponse:
        conv = None
        subject_id = req.subject_id
        if req.conversation_id:
            conv = await self.repo.get(req.conversation_id, user_id=user_id)
            if not conv:
                raise NotFoundError("Conversation not found")
            subject_id = conv.get("subject_id")  # a conversation stays bound to its subject
        subject = await self.subjects.get_owned(user_id, subject_id) if subject_id else None

        history = [{"role": m["role"], "content": m["content"]} for m in (conv["messages"] if conv else [])]
        reply, sources = await ChatAgent(get_llm_client(), get_retriever()).reply(
            user_id=user_id, subject=subject, history=history, message=req.message
        )

        now = utcnow()
        new_messages = [
            {"role": "user", "content": req.message, "at": now},
            {"role": "assistant", "content": reply, "at": now, "sources": [s.model_dump() for s in sources]},
        ]
        if conv:
            await self.repo.col.update_one(
                {"_id": to_oid(conv["id"])},
                {"$push": {"messages": {"$each": new_messages}}, "$set": {"updated_at": now}},
            )
            conv_id = conv["id"]
        else:
            created = await self.repo.insert(
                {"user_id": user_id, "subject_id": subject_id, "title": req.message[:60], "messages": new_messages}
            )
            conv_id = created["id"]
        return ChatResponse(conversation_id=conv_id, reply=reply, sources=sources)

    async def list(self, user_id: str, subject_id: str | None) -> list[dict]:
        filters: dict = {"user_id": user_id}
        if subject_id:
            filters["subject_id"] = subject_id
        convs = await self.repo.list(filters, sort=[("updated_at", -1)], limit=50)
        return [{"id": c["id"], "title": c["title"], "subject_id": c.get("subject_id"), "updated_at": c["updated_at"]} for c in convs]

    async def get(self, user_id: str, conversation_id: str) -> dict:
        conv = await self.repo.get(conversation_id, user_id=user_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        return conv
