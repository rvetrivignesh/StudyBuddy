import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.ai.container import get_vector_store
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import AppError
from app.core.logging import setup_logging
from app.db import mongo

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    mongo.connect()
    await mongo.ensure_indexes()  # fail fast if MongoDB is unreachable
    try:
        await get_vector_store().ensure_collection()
    except Exception:
        logger.warning("Qdrant not reachable at startup; it will be retried on first use")
    yield
    await mongo.close()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}


@app.get("/health/ready", tags=["meta"])
async def ready():
    return {"mongo": await mongo.ping()}


app.include_router(api_router)
