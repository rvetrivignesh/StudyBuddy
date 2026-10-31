# Study Companion - Backend

FastAPI + **MongoDB** (async PyMongo) + Qdrant (RAG) + LiteLLM (Ollama locally, or free hosted APIs) + tool-calling agents.

## Quick start

```bash
cp .env.example .env            # set JWT_SECRET
docker compose up -d mongo qdrant ollama
./scripts/pull_models.sh        # or: docker compose exec ollama ollama pull qwen3:8b (etc.)

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # add requirements-extra.txt for speech-to-text
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs. Everything also runs in Docker: `docker compose up --build`.
Tests: `pip install -r requirements-dev.txt && pytest` (no external services needed).

## Layering (dependencies point downward only)

```
api/v1  ->  services  ->  ai/agents  ->  ai/llm | ai/rag | ai/tools
(HTTP)     (business)     (AI logic)     (infrastructure)
                  \-> db/repositories (MongoDB)
```

| Folder | Responsibility |
|---|---|
| `app/api/v1` | Thin routers: validate input, call one service, return a schema |
| `app/services` | Business rules, ownership checks, caching, persistence. `scheduling.py` is the pure study-plan algorithm |
| `app/ai/agents` | One class per AI feature (syllabus, deep learning, flashcards, MCQ, long answer, chat, planner weights, resume) |
| `app/ai/llm` | `LLMClient` (chat / structured JSON with retry / embeddings), task->model `registry.py`, prompts as `.md` files |
| `app/ai/rag` | parsers -> chunking -> embeddings -> Qdrant `vectorstore.py` -> `retriever.py` |
| `app/ai/tools` | Tool-calling functions (`retrieve_notes`, `web_search`); register new ones in `registry.py` |
| `app/db` | Mongo connection, indexes, generic `Repository`, one repository per collection |
| `app/schemas` | Pydantic request/response models (also the JSON schemas the LLM must follow) |

## Feature -> endpoint map

| Feature | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Subjects | `POST/GET /subjects`, `GET/PATCH/DELETE /subjects/{id}`, `POST /subjects/{id}/parse-syllabus` |
| Upload material (RAG) | `POST/GET /subjects/{id}/documents`, `GET/DELETE /subjects/{id}/documents/{doc_id}` |
| Deep learning / flashcards | `POST /learn/deep-dive`, `POST /learn/flashcards` |
| Recall (MCQ) | `POST /recall/mcq/generate`, `POST /recall/mcq/{quiz_id}/submit` |
| Recall (long answer) | `POST /recall/long/question`, `POST /recall/long/evaluate`, `POST /recall/transcribe` (speech) |
| Chatbot | `POST /chat`, `GET /chat/conversations[/{id}]` |
| Planner | `POST/GET /subjects/{id}/plan`, `GET /subjects/{id}/plan/export.ics` |
| Resume | `POST /resume/upload`, `PUT/PATCH/GET /resume`, `POST /resume/analyze`, `GET /resume/analysis` |

All routes except register/login need `Authorization: Bearer <token>`. All paths are prefixed with `/api/v1`.

## Design decisions worth knowing

- **Task-based model routing.** Agents call `llm.structured("grading", ...)`; `.env` decides which model serves `grading`. Moving a task from Ollama to Groq/Gemini is a one-line change (`MODEL_GRADING=groq/...`).
- **Structured output with retry.** Every LLM result is validated against a Pydantic schema; on failure the error is fed back to the model once. This is what makes small local models reliable.
- **Scoring is code, not LLM.** MCQ answers are scored in Python; correct answers/explanations are revealed only for wrong answers.
- **Planner = LLM + algorithm.** The LLM only rates topic effort (1-5). Dates, sessions, revision slots and the final mock test come from `services/scheduling.py`, which is unit-tested.
- **Grounding.** Every retrieval is filtered by `user_id` + `subject_id`. Answers include sources. Agents fall back to general knowledge (flagged via `grounded`) when nothing is uploaded.
- **Background work.** Document indexing and syllabus parsing use FastAPI `BackgroundTasks`; poll `status` / `topics_status`. For heavier load, move `ingest_document` and `parse_syllabus_task` to Celery/ARQ - they are already plain async functions of an id.
- **Privacy.** Raw resume files are never stored; only the extracted structured fields.
- **MongoDB.** Uses the official async PyMongo client (`AsyncMongoClient`; Motor is deprecated). Dates are stored as ISO strings, foreign keys as strings. Indexes are created on startup (`db/mongo.py`).

## Status / not done yet

- Google Calendar **API sync** is a stub (`services/google_calendar.py`). The `.ics` export works and imports into Google Calendar.
- No token streaming (SSE) yet for chat/deep-dive.
- No OCR for scanned PDFs, no reranker, no rate limiting / refresh tokens.
- Written and unit-tested without live services: tests cover scheduling, calendar export, chunking, file parsing, JSON extraction, the tool-calling loop and the MCQ agent (with a scripted fake LLM). The Mongo, Qdrant and Ollama integrations have not been run against live servers, so expect small fixes on first run.

## Adding things

- **New agent:** add `app/ai/agents/<name>.py` (subclass `BaseAgent`), a prompt in `app/ai/llm/prompts/<name>.md`, a task name in `registry.py` + `config.py`, then call it from a service.
- **New tool:** write a Pydantic args model + async handler, wrap in `Tool(...)`, register in `app/ai/tools/registry.py`, give it to an agent via `get_tools([...])`.
- **Swap vector DB:** reimplement `app/ai/rag/vectorstore.py` (3 methods: `upsert`, `search`, `delete_where`).
