from app.ai.agents.base import BaseAgent
from app.ai.llm.prompts import load_prompt
from app.schemas.subject import Topic, TopicTree


class SyllabusAgent(BaseAgent):
    async def parse(self, syllabus: str) -> list[Topic]:
        tree = await self.llm.structured("syllabus", load_prompt("syllabus"), syllabus[:20000], TopicTree)
        return tree.topics
