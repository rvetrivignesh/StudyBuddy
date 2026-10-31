from app.ai.agents.base import BaseAgent, material_block
from app.ai.llm.prompts import load_prompt
from app.schemas.learning import FlashcardSet, FlashcardSetContent


class FlashcardAgent(BaseAgent):
    async def generate(self, *, user_id: str, subject: dict, topic: str, count: int = 10) -> FlashcardSet:
        context, _, _ = await self.ground(f"{subject['name']}: {topic}", user_id=user_id, subject_id=subject["id"], k=4)
        user = f"Subject: {subject['name']}\nTopic: {topic}\nCreate {count} flashcards.\n\n{material_block(context)}"
        content = await self.llm.structured("flashcards", load_prompt("flashcards"), user, FlashcardSetContent, temperature=0.4)
        return FlashcardSet(topic=topic, cards=content.cards[:count])
