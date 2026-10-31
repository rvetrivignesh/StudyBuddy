from fastapi import APIRouter, Depends

from app.api.deps import chat_service, get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_current_user), svc: ChatService = Depends(chat_service)):
    """Tool-calling study chatbot (notes retrieval + web search). Omit subject_id for a general chat."""
    return await svc.send(user["id"], body)


@router.get("/conversations")
async def list_conversations(subject_id: str | None = None, user: dict = Depends(get_current_user), svc: ChatService = Depends(chat_service)):
    return await svc.list(user["id"], subject_id)


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user), svc: ChatService = Depends(chat_service)):
    return await svc.get(user["id"], conversation_id)
