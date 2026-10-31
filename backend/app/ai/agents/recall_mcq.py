from app.ai.agents.base import BaseAgent, material_block
from app.ai.llm.prompts import load_prompt
from app.core.errors import UpstreamError
from app.schemas.recall import MCQuestion, QuizContent


class MCQAgent(BaseAgent):
    async def generate(self, *, user_id: str, subject: dict, topic: str, count: int = 10) -> list[MCQuestion]:
        context, _, _ = await self.ground(f"{subject['name']}: {topic}", user_id=user_id, subject_id=subject["id"], k=6)
        questions: list[MCQuestion] = []
        for _ in range(2):  # small models sometimes return fewer questions: ask once more for the rest
            missing = count - len(questions)
            if missing <= 0:
                break
            asked = "\n".join(f"- {q.question}" for q in questions)
            user = (
                f"Subject: {subject['name']}\nTopic: {topic}\nWrite exactly {missing} questions."
                + (f"\nDo NOT repeat these questions:\n{asked}" if asked else "")
                + f"\n\n{material_block(context)}"
            )
            quiz = await self.llm.structured("recall_mcq", load_prompt("mcq"), user, QuizContent, temperature=0.5)
            questions.extend(quiz.questions)
        if len(questions) < count:
            raise UpstreamError(f"Model produced only {len(questions)} valid questions; try again.")
        return questions[:count]
