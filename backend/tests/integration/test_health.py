import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from app.api.app import create_app
from app.core.config import Settings

pytestmark = pytest.mark.integration


def test_health_reports_service_identity(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["X-Request-ID"]


def test_ready_when_database_reachable_and_migrated(client) -> None:
    response = client.get("/health/ready")
    assert response.status_code == 200, response.text
    checks = response.json()["checks"]
    assert checks["database"]["status"] == "ok"
    assert checks["migrations"]["current"] == checks["migrations"]["expected"]


def test_not_ready_when_database_unreachable() -> None:
    url = "postgresql+psycopg://nobody:nothing@127.0.0.1:1/none"
    engine = create_engine(url, connect_args={"connect_timeout": 1})
    app = create_app(Settings(_env_file=None, environment="test", database_url=url), engine)
    response = TestClient(app).get("/health/ready")
    assert response.status_code == 503
    assert response.json()["checks"]["database"]["status"] == "unavailable"


def test_unknown_route_uses_the_error_envelope(client) -> None:
    response = client.get("/v1/does-not-exist", headers={"X-Request-ID": "trace-1"})
    assert response.status_code == 404
    assert response.json() == {
        "code": "not_found",
        "message": "Not Found",
        "details": None,
        "request_id": "trace-1",
    }
