from app.db.repository import Repository


class UserRepository(Repository):
    collection = "users"

    async def get_by_email(self, email: str) -> dict | None:
        return await self.find_one({"email": email.lower()})


class SubjectRepository(Repository):
    collection = "subjects"


class DocumentRepository(Repository):
    collection = "documents"


class PlanRepository(Repository):
    collection = "plans"


class QuizRepository(Repository):
    collection = "quizzes"


class AttemptRepository(Repository):
    collection = "recall_attempts"


class FlashcardSetRepository(Repository):
    collection = "flashcard_sets"


class DeepDiveRepository(Repository):
    collection = "deep_dives"


class ConversationRepository(Repository):
    collection = "conversations"


class ResumeRepository(Repository):
    collection = "resumes"


class ResumeAnalysisRepository(Repository):
    collection = "resume_analyses"
