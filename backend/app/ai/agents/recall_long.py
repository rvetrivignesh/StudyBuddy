from app.ai.agents.base import BaseAgent, material_block
from app.ai.llm.prompts import load_prompt
from app.schemas.recall import LongAnswerFeedback, LongQuestion


class LongAnswerAgent(BaseAgent):
    async def question(self, *, user_id: str, subject: dict, topic: str) -> LongQuestion:
        context, _, _ = await self.ground(f"{subject['name']}: {topic}", user_id=user_id, subject_id=subject["id"], k=4)
        user = f"Subject: {subject['name']}\nTopic: {topic}\n\n{material_block(context)}"
        return await self.llm.structured("recall_mcq", load_prompt("long_question"), user, LongQuestion, temperature=0.6)

    async def evaluate(self, *, user_id: str, subject: dict, topic: str, question: str, answer: str) -> LongAnswerFeedback:
        context, _, _ = await self.ground(question, user_id=user_id, subject_id=subject["id"], k=6)
        user = f"Subject: {subject['name']}\nTopic: {topic}\nQuestion: {question}\n\nSTUDENT ANSWER:\n{answer}\n\n{material_block(context)}"
        return await self.llm.structured("grading", load_prompt("long_grading"), user, LongAnswerFeedback, temperature=0.1)
