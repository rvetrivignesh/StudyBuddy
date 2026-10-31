studybuddy/
├── app/
│   ├── main.py                  # FastAPI app factory, router registration
│   ├── core/
│   │   ├── config.py            # settings (model names, URLs, keys)
│   │   ├── security.py
│   │   └── logging.py
│   ├── db/
│   │   ├── base.py, session.py
│   │   └── models/              # user, subject, document, plan, quiz, resume...
│   ├── schemas/                 # Pydantic request/response models
│   ├── api/v1/
│   │   ├── subjects.py
│   │   ├── learn.py             # deep-learning + flashcards
│   │   ├── recall.py            # mcq + long answer
│   │   ├── chat.py
│   │   ├── documents.py         # uploads
│   │   ├── planner.py
│   │   └── resume.py
│   ├── services/                # business logic (no FastAPI imports here)
│   │   ├── subject_service.py
│   │   ├── planner_service.py
│   │   ├── resume_service.py
│   │   └── calendar_export.py   # .ics + Google Calendar
│   ├── ai/
│   │   ├── llm/
│   │   │   ├── client.py        # LLMClient interface (chat, structured, stream)
│   │   │   ├── registry.py      # task -> model mapping
│   │   │   └── prompts/         # versioned prompt templates (.md/.jinja)
│   │   ├── rag/
│   │   │   ├── ingest.py        # parse -> chunk -> embed -> store
│   │   │   ├── parsers.py       # pdf, docx, pptx, txt
│   │   │   ├── chunking.py
│   │   │   ├── embeddings.py
│   │   │   ├── retriever.py     # hybrid search + rerank
│   │   │   └── vectorstore.py   # Qdrant wrapper
│   │   ├── tools/               # tool-calling functions
│   │   │   ├── web_search.py
│   │   │   ├── retrieve_notes.py
│   │   │   ├── calendar_tools.py
│   │   │   └── registry.py
│   │   └── agents/
│   │       ├── base.py
│   │       ├── deep_learning.py
│   │       ├── flashcards.py
│   │       ├── recall_mcq.py
│   │       ├── recall_long.py
│   │       ├── chatbot.py
│   │       ├── planner.py
│   │       ├── resume_parser.py
│   │       └── resume_analyzer.py
│   └── workers/                 # background tasks (ingestion)
├── tests/
├── alembic/
├── docker-compose.yml           # postgres, qdrant, ollama
└── pyproject.toml