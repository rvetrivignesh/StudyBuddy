from app.ai.agents.deep_learning import DeepLearningAgent
from app.ai.agents.flashcards import FlashcardAgent
from app.ai.container import get_llm_client, get_retriever
from app.db.repositories import DeepDiveRepository, FlashcardSetRepository
from app.schemas.learning import DeepDive, FlashcardSet
from app.services.subject_service import SubjectService


class LearningService:
    """Deep-learning notes and flashcards, cached per (user, subject, topic)."""

    def __init__(self, db):
        self.subjects = SubjectService(db)
        self.dives = DeepDiveRepository(db)
        self.cards = FlashcardSetRepository(db)

    async def deep_dive(self, user_id: str, subject_id: str, topic: str, refresh: bool) -> DeepDive:
        subject = await self.subjects.get_owned(user_id, subject_id)
        key = {"user_id": user_id, "subject_id": subject_id, "topic_key": topic.strip().lower()}
        if not refresh and (cached := await self.dives.find_one(key)):
            return DeepDive(**cached["content"])
        dive = await DeepLearningAgent(get_llm_client(), get_retriever()).explain(user_id=user_id, subject=subject, topic=topic)
        await self.dives.upsert(key, {"content": dive.model_dump()})
        return dive

    async def flashcards(self, user_id: str, subject_id: str, topic: str, count: int, refresh: bool) -> FlashcardSet:
        subject = await self.subjects.get_owned(user_id, subject_id)
        key = {"user_id": user_id, "subject_id": subject_id, "topic_key": topic.strip().lower()}
        if not refresh and (cached := await self.cards.find_one(key)):
            if len(cached["content"]["cards"]) >= count:
                return FlashcardSet(**{**cached["content"], "cards": cached["content"]["cards"][:count]})
        result = await FlashcardAgent(get_llm_client(), get_retriever()).generate(
            user_id=user_id, subject=subject, topic=topic, count=count
        )
        await self.cards.upsert(key, {"content": result.model_dump()})
        return result
