from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)  # no `with`: skips lifespan, so no MongoDB needed


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_openapi_lists_all_feature_routes():
    paths = client.get("/openapi.json").json()["paths"]
    for p in [
        "/api/v1/auth/register",
        "/api/v1/subjects",
        "/api/v1/subjects/{subject_id}/documents",
        "/api/v1/learn/deep-dive",
        "/api/v1/learn/flashcards",
        "/api/v1/recall/mcq/generate",
        "/api/v1/recall/long/evaluate",
        "/api/v1/chat",
        "/api/v1/subjects/{subject_id}/plan",
        "/api/v1/subjects/{subject_id}/plan/export.ics",
        "/api/v1/resume",
        "/api/v1/resume/upload",
        "/api/v1/resume/analyze",
    ]:
        assert p in paths, p


def test_protected_routes_require_auth():
    assert client.get("/api/v1/subjects").status_code == 401
    assert client.get("/api/v1/resume").status_code == 401
