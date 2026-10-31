import asyncio
import json
from types import SimpleNamespace

import pytest

from app.ai.agents.recall_mcq import MCQAgent
from app.ai.agents.tool_loop import run_tool_loop
from app.ai.llm.client import LLMClient
from app.ai.rag.parsers import parse_file
from app.ai.rag.retriever import RetrievedChunk
from app.ai.tools.base import ToolContext
from app.ai.tools.registry import get_tools


def test_parse_txt_docx_pptx_pdf(tmp_path):
    (tmp_path / "a.txt").write_text("hello world")
    assert parse_file(tmp_path / "a.txt") == [(None, "hello world")]

    from docx import Document

    d = Document()
    d.add_paragraph("Docx paragraph")
    d.save(tmp_path / "a.docx")
    assert "Docx paragraph" in parse_file(tmp_path / "a.docx")[0][1]

    from pptx import Presentation

    p = Presentation()
    s = p.slides.add_slide(p.slide_layouts[1])
    s.shapes.title.text = "Slide title"
    p.save(tmp_path / "a.pptx")
    assert parse_file(tmp_path / "a.pptx")[0] == (1, "Slide title")

    import pymupdf

    pdf = pymupdf.open()
    pdf.new_page().insert_text((72, 72), "PDF text here")
    pdf.save(tmp_path / "a.pdf")
    assert parse_file(tmp_path / "a.pdf")[0][0] == 1

    with pytest.raises(ValueError):
        parse_file(tmp_path / "a.exe")


class FakeRetriever:
    async def search(self, query, **kw):
        return [RetrievedChunk(text="Mitochondria make ATP.", filename="bio.pdf", page=3, doc_id="d1", score=0.9)]


def _call(name, args, id="c1"):
    return SimpleNamespace(id=id, function=SimpleNamespace(name=name, arguments=json.dumps(args)))


class ScriptedLLM(LLMClient):
    """Replays scripted assistant messages instead of calling a model."""

    def __init__(self, messages):
        self.script = list(messages)

    async def chat(self, task, messages, **kw):
        return self.script.pop(0)


def test_tool_loop_executes_tool_then_answers():
    llm = ScriptedLLM(
        [
            SimpleNamespace(content="", tool_calls=[_call("retrieve_notes", {"query": "ATP"})]),
            SimpleNamespace(content="<think>x</think>Mitochondria make ATP [1].", tool_calls=None),
        ]
    )
    ctx = ToolContext(user_id="u", subject_id="s", retriever=FakeRetriever())
    messages = [{"role": "user", "content": "What makes ATP?"}]
    answer = asyncio.run(run_tool_loop(llm, "chat", messages, get_tools(["retrieve_notes"]), ctx))
    assert answer == "Mitochondria make ATP [1]."
    assert ctx.sources and ctx.sources[0].title == "bio.pdf" and ctx.sources[0].location == "p.3"
    assert messages[-1]["role"] == "tool" and "Mitochondria" in messages[-1]["content"]


def test_tool_with_bad_arguments_returns_error_text_not_exception():
    tool = get_tools(["retrieve_notes"])[0]
    ctx = ToolContext(user_id="u", subject_id="s", retriever=FakeRetriever())
    out = asyncio.run(tool.run(ctx, "{not json"))
    assert out.startswith("Invalid arguments")


def test_structured_retries_with_feedback_and_mcq_agent():
    good = {"questions": [{"question": f"Q{i}", "options": ["a", "b", "c", "d"], "correct_index": i % 4, "explanation": "because"} for i in range(10)]}
    llm = ScriptedLLM(
        [
            SimpleNamespace(content="not json at all", tool_calls=None),  # first attempt invalid -> retry
            SimpleNamespace(content="```json\n" + json.dumps(good) + "\n```", tool_calls=None),
        ]
    )
    questions = asyncio.run(
        MCQAgent(llm, FakeRetriever()).generate(user_id="u", subject={"id": "s", "name": "Bio"}, topic="Cells", count=10)
    )
    assert len(questions) == 10 and questions[3].correct_index == 3
