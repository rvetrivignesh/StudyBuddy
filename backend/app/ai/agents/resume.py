import json

from app.ai.agents.base import BaseAgent
from app.ai.llm.prompts import load_prompt
from app.schemas.resume import ResumeAnalysisContent, ResumeData


class ResumeParserAgent(BaseAgent):
    async def parse(self, text: str) -> ResumeData:
        return await self.llm.structured("resume_parse", load_prompt("resume_parse"), text[:15000], ResumeData, temperature=0.0)


class ResumeAnalyzerAgent(BaseAgent):
    async def analyze(self, resume: dict, job_description: str | None = None) -> ResumeAnalysisContent:
        user = f"RESUME (JSON):\n{json.dumps(resume, default=str)}"
        if job_description:
            user += f"\n\nTARGET JOB DESCRIPTION:\n{job_description[:6000]}"
        return await self.llm.structured("resume_analyze", load_prompt("resume_analyze"), user, ResumeAnalysisContent, temperature=0.2)
