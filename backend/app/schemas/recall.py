from pydantic import BaseModel, Field


class MCQuestion(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str


class QuizContent(BaseModel):
    """LLM output schema."""

    questions: list[MCQuestion]


class MCQRequest(BaseModel):
    subject_id: str
    topic: str = Field(min_length=1, max_length=200)
    count: int = Field(10, ge=3, le=20)


class QuizQuestionPublic(BaseModel):
    question: str
    options: list[str]


class QuizOut(BaseModel):
    id: str
    topic: str
    questions: list[QuizQuestionPublic]


class SubmitAnswers(BaseModel):
    answers: list[int | None] = Field(description="Selected option index per question (null = skipped)")


class QuestionResult(BaseModel):
    question: str
    selected_index: int | None
    is_correct: bool
    correct_index: int | None = None  # only revealed for wrong answers
    correct_answer: str | None = None
    explanation: str | None = None  # only for wrong answers


class QuizResult(BaseModel):
    score: int
    total: int
    percentage: float
    results: list[QuestionResult]


class LongQuestionRequest(BaseModel):
    subject_id: str
    topic: str = Field(min_length=1, max_length=200)


class LongQuestion(BaseModel):
    question: str


class LongAnswerRequest(BaseModel):
    subject_id: str
    topic: str
    question: str
    answer: str = Field(min_length=5, max_length=8000, description="Typed text, or text returned by /recall/transcribe")


class LongAnswerFeedback(BaseModel):
    score: int = Field(ge=0, le=10)
    correct_points: list[str]
    incorrect_points: list[str]
    missing_points: list[str]
    suggestions: list[str]
    overall: str


class Transcription(BaseModel):
    text: str
