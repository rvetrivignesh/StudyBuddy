from app.ai.agents.base import BaseAgent, material_block
from app.ai.llm.prompts import load_prompt
from app.schemas.learning import DeepDive, DeepDiveContent


class DeepLearningAgent(BaseAgent):
    async def explain(self, *, user_id: str, subject: dict, topic: str) -> DeepDive:
        context, chunks, sources = await self.ground(
            f"{subject['name']}: {topic}", user_id=user_id, subject_id=subject["id"], k=8
        )
        user = f"Subject: {subject['name']}\nTopic: {topic}\n\n{material_block(context)}"
        content = await self.llm.structured("deep_learning", load_prompt("deep_learning"), user, DeepDiveContent, temperature=0.3)
        return DeepDive(**content.model_dump(), topic=topic, grounded=bool(chunks), sources=sources)
