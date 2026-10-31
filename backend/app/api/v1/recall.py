from fastapi import APIRouter, Depends, UploadFile

from app.api.deps import get_current_user, recall_service
from app.schemas.recall import (
    LongAnswerFeedback,
    LongAnswerRequest,
    LongQuestion,
    LongQuestionRequest,
    MCQRequest,
    QuizOut,
    QuizResult,
    SubmitAnswers,
    Transcription,
)
from app.services.recall_service import RecallService

router = APIRouter(prefix="/recall", tags=["recall"])


@router.post("/mcq/generate", response_model=QuizOut)
async def generate_mcq(body: MCQRequest, user: dict = Depends(get_current_user), svc: RecallService = Depends(recall_service)):
    return await svc.generate_mcq(user["id"], body.subject_id, body.topic, body.count)


@router.post("/mcq/{quiz_id}/submit", response_model=QuizResult)
async def submit_mcq(quiz_id: str, body: SubmitAnswers, user: dict = Depends(get_current_user), svc: RecallService = Depends(recall_service)):
    """Returns the score plus explanations for the questions answered wrongly."""
    return await svc.submit_mcq(user["id"], quiz_id, body.answers)


@router.post("/long/question", response_model=LongQuestion)
async def long_question(body: LongQuestionRequest, user: dict = Depends(get_current_user), svc: RecallService = Depends(recall_service)):
    return await svc.long_question(user["id"], body.subject_id, body.topic)


@router.post("/long/evaluate", response_model=LongAnswerFeedback)
async def evaluate_long(body: LongAnswerRequest, user: dict = Depends(get_current_user), svc: RecallService = Depends(recall_service)):
    return await svc.evaluate_long(user["id"], body)


@router.post("/transcribe", response_model=Transcription)
async def transcribe(file: UploadFile, user: dict = Depends(get_current_user), svc: RecallService = Depends(recall_service)):
    """Speech -> text. Feed the result into /recall/long/evaluate."""
    return await svc.transcribe(file)
