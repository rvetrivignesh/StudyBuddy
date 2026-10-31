import json

from app.ai.agents.base import BaseAgent
from app.ai.llm.prompts import load_prompt
from app.schemas.planner import TopicWeights
from app.schemas.subject import Topic


class PlannerAgent(BaseAgent):
    """The LLM only estimates *effort per topic*. Dates/sessions are computed by the
    deterministic scheduler in app/services/scheduling.py (LLMs are bad at calendar math)."""

    async def weight_topics(self, subject_name: str, topics: list[Topic], pace: str) -> list[Topic]:
        payload = json.dumps({"subject": subject_name, "learner_pace": pace, "topics": [t.title for t in topics]})
        result = await self.llm.structured("planner", load_prompt("planner_weights"), payload, TopicWeights)
        by_title = {w.title.strip().lower(): w.weight for w in result.weights}
        return [t.model_copy(update={"weight": by_title.get(t.title.strip().lower(), t.weight)}) for t in topics]
