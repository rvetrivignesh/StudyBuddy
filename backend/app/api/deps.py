from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.errors import UnauthorizedError
from app.core.security import decode_access_token
from app.db.mongo import get_db
from app.db.repositories import UserRepository
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.learning_service import LearningService
from app.services.planner_service import PlannerService
from app.services.recall_service import RecallService
from app.services.resume_service import ResumeService
from app.services.subject_service import SubjectService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    user_id = decode_access_token(token)
    user = await UserRepository(get_db()).get(user_id) if user_id else None
    if not user:
        raise UnauthorizedError("Invalid or expired token")
    return user


# service factories (one per request; cheap - they only hold repositories)
def auth_service() -> AuthService:
    return AuthService(get_db())


def subject_service() -> SubjectService:
    return SubjectService(get_db())


def document_service() -> DocumentService:
    return DocumentService(get_db())


def learning_service() -> LearningService:
    return LearningService(get_db())


def recall_service() -> RecallService:
    return RecallService(get_db())


def chat_service() -> ChatService:
    return ChatService(get_db())


def planner_service() -> PlannerService:
    return PlannerService(get_db())


def resume_service() -> ResumeService:
    return ResumeService(get_db())
