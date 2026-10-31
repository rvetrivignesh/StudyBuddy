from fastapi import APIRouter

from app.api.v1 import auth, chat, documents, learn, planner, recall, resume, subjects
from app.core.config import settings

api_router = APIRouter(prefix=settings.api_prefix)
for module in (auth, subjects, documents, learn, recall, chat, planner, resume):
    api_router.include_router(module.router)
