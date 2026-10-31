import tempfile
from pathlib import Path

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.ai import speech
from app.ai.agents.recall_long import LongAnswerAgent
from app.ai.agents.recall_mcq import MCQAgent
from app.ai.container import get_llm_client, get_retriever
from app.core.errors import NotFoundError, ValidationFailed
from app.db.repositories import AttemptRepository, QuizRepository
from app.schemas.recall import (
    LongAnswerFeedback,
    LongAnswerRequest,
    LongQuestion,
    QuestionResult,
    QuizOut,
    QuizQuestionPublic,
    QuizResult,
    Transcription,
)
from app.services.subject_service import SubjectService


class RecallService:
    def __init__(self, db):
        self.subjects = SubjectService(db)
        self.quizzes = QuizRepository(db)
        self.attempts = AttemptRepository(db)

    # ---------- MCQ ----------
    async def generate_mcq(self, user_id: str, subject_id: str, topic: str, count: int) -> QuizOut:
        subject = await self.subjects.get_owned(user_id, subject_id)
        questions = await MCQAgent(get_llm_client(), get_retriever()).generate(
            user_id=user_id, subject=subject, topic=topic, count=count
        )
        quiz = await self.quizzes.insert(
            {"user_id": user_id, "subject_id": subject_id, "topic": topic, "questions": [q.model_dump() for q in questions]}
        )
        # answers stay server-side until the quiz is submitted
        return QuizOut(
            id=quiz["id"],
            topic=topic,
            questions=[QuizQuestionPublic(question=q.question, options=q.options) for q in questions],
        )

    async def submit_mcq(self, user_id: str, quiz_id: str, answers: list[int | None]) -> QuizResult:
        quiz = await self.quizzes.get(quiz_id, user_id=user_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        questions = quiz["questions"]
        if len(answers) != len(questions):
            raise ValidationFailed(f"Expected {len(questions)} answers, got {len(answers)}")

        results, score = [], 0
        for q, picked in zip(questions, answers):
            correct = picked == q["correct_index"]  # scored in plain Python, never by the LLM
            score += int(correct)
            results.append(
                QuestionResult(
                    question=q["question"],
                    selected_index=picked,
                    is_correct=correct,
                    correct_index=None if correct else q["correct_index"],
                    correct_answer=None if correct else q["options"][q["correct_index"]],
                    explanation=None if correct else q["explanation"],
                )
            )
        total = len(questions)
        await self.attempts.insert(
            {"user_id": user_id, "subject_id": quiz["subject_id"], "kind": "mcq", "topic": quiz["topic"], "quiz_id": quiz_id, "score": score, "total": total}
        )
        return QuizResult(score=score, total=total, percentage=round(100 * score / total, 1), results=results)

    # ---------- Long answer ----------
    async def long_question(self, user_id: str, subject_id: str, topic: str) -> LongQuestion:
        subject = await self.subjects.get_owned(user_id, subject_id)
        return await LongAnswerAgent(get_llm_client(), get_retriever()).question(user_id=user_id, subject=subject, topic=topic)

    async def evaluate_long(self, user_id: str, body: LongAnswerRequest) -> LongAnswerFeedback:
        subject = await self.subjects.get_owned(user_id, body.subject_id)
        feedback = await LongAnswerAgent(get_llm_client(), get_retriever()).evaluate(
            user_id=user_id, subject=subject, topic=body.topic, question=body.question, answer=body.answer
        )
        await self.attempts.insert(
            {"user_id": user_id, "subject_id": body.subject_id, "kind": "long", "topic": body.topic, "score": feedback.score, "total": 10}
        )
        return feedback

    async def transcribe(self, file: UploadFile) -> Transcription:
        """Speech -> text. The returned text is then sent to /recall/long/evaluate like a typed answer."""
        suffix = Path(file.filename or "audio.webm").suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await file.read())
            path = tmp.name
        try:
            text = await run_in_threadpool(speech.transcribe, path)
        finally:
            Path(path).unlink(missing_ok=True)
        return Transcription(text=text)
