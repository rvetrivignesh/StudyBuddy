"""Process-wide AI singletons."""
from functools import lru_cache

from app.ai.llm.client import LLMClient
from app.ai.rag.retriever import Retriever
from app.ai.rag.vectorstore import VectorStore


@lru_cache
def get_llm_client() -> LLMClient:
    return LLMClient()


@lru_cache
def get_vector_store() -> VectorStore:
    return VectorStore()


@lru_cache
def get_retriever() -> Retriever:
    return Retriever(get_llm_client(), get_vector_store())
