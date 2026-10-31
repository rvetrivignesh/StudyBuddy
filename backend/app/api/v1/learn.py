from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, learning_service
from app.schemas.learning import DeepDive, FlashcardRequest, FlashcardSet, TopicRequest
from app.services.learning_service import LearningService

router = APIRouter(prefix="/learn", tags=["learn"])


@router.post("/deep-dive", response_model=DeepDive)
async def deep_dive(body: TopicRequest, user: dict = Depends(get_current_user), svc: LearningService = Depends(learning_service)):
    """In-depth, structured explanation of a topic (grounded in uploaded material when available)."""
    return await svc.deep_dive(user["id"], body.subject_id, body.topic, body.refresh)


@router.post("/flashcards", response_model=FlashcardSet)
async def flashcards(body: FlashcardRequest, user: dict = Depends(get_current_user), svc: LearningService = Depends(learning_service)):
    """Quick, reel-style cards for a topic."""
    return await svc.flashcards(user["id"], body.subject_id, body.topic, body.count, body.refresh)
