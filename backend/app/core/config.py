from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # app
    app_name: str = "Study Companion API"
    env: str = "dev"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # auth
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24

    # mongodb
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "study_companion"

    # vector store
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "study_chunks"
    embedding_dim: int = 768

    # files
    upload_dir: str = "./data/uploads"
    max_upload_mb: int = 25

    # llm
    ollama_base_url: str = "http://localhost:11434"
    llm_timeout: int = 180
    disable_qwen_thinking: bool = True  # appends /no_think for Qwen3 models (faster, cleaner JSON)
    groq_api_key: str | None = None
    gemini_api_key: str | None = None

    # model per task (LiteLLM model strings)
    model_chat: str = "ollama_chat/qwen3:8b"
    model_deep_learning: str = "ollama_chat/qwen3:8b"
    model_flashcards: str = "ollama_chat/qwen3:4b"
    model_recall_mcq: str = "ollama_chat/qwen3:8b"
    model_grading: str = "ollama_chat/qwen3:8b"
    model_planner: str = "ollama_chat/qwen3:8b"
    model_syllabus: str = "ollama_chat/qwen3:8b"
    model_resume_parse: str = "ollama_chat/qwen3:8b"
    model_resume_analyze: str = "ollama_chat/qwen3:8b"
    model_embedding: str = "ollama/nomic-embed-text"

    # speech
    whisper_model: str = "small"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
