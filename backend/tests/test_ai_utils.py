from app.ai.llm.client import extract_json, strip_think
from app.ai.llm.prompts import load_prompt
from app.ai.rag.chunking import chunk_pages, chunk_text
from app.schemas.recall import QuizContent


def test_extract_json_handles_fences_think_and_prose():
    assert extract_json('<think>hmm</think>```json\n{"a": 1}\n```') == {"a": 1}
    assert extract_json('Sure! Here you go: {"a": [1, 2]} hope it helps') == {"a": [1, 2]}


def test_strip_think():
    assert strip_think("<think>x</think>Answer") == "Answer"


def test_chunking_respects_size_and_overlap():
    text = "\n\n".join(f"Paragraph {i}. " + "word " * 120 for i in range(30))
    chunks = chunk_text(text, size=1000, overlap=100)
    assert len(chunks) > 3 and all(len(c) < 1400 for c in chunks)
    assert chunk_text("") == []
    assert len(chunk_text("x" * 5000, size=1000, overlap=100)) >= 5


def test_chunk_pages_keeps_page_numbers():
    chunks = chunk_pages([(1, "alpha beta"), (2, "gamma delta")])
    assert [c.page for c in chunks] == [1, 2]


def test_mcq_schema_rejects_bad_option_count():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        QuizContent.model_validate({"questions": [{"question": "q", "options": ["a", "b"], "correct_index": 0, "explanation": "e"}]})


def test_all_prompts_load():
    for name in ["syllabus", "planner_weights", "deep_learning", "flashcards", "mcq", "long_question", "long_grading", "resume_parse", "resume_analyze"]:
        assert load_prompt(name).strip()
    assert "Physics" in load_prompt("chat", subject_name="Physics")
