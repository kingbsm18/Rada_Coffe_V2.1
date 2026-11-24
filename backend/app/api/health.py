from typing import Annotated, Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError

from app import __version__
from app.api.deps import get_engine_dep, get_settings_dep
from app.core.config import Settings
from app.core.db import current_migration_revision, expected_migration_head

router = APIRouter(tags=["health"])


@router.get("/health")
def health(settings: Annotated[Settings, Depends(get_settings_dep)]) -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "rada-backend",
        "version": __version__,
        "environment": settings.environment,
    }


@router.get("/health/ready")
def ready(engine: Annotated[Engine, Depends(get_engine_dep)]) -> JSONResponse:
    checks: dict[str, Any] = {}
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok"}
        current, expected = current_migration_revision(engine), expected_migration_head()
        checks["migrations"] = {
            "status": "ok" if current == expected else "pending",
            "current": current,
            "expected": expected,
        }
    except SQLAlchemyError as error:
        checks["database"] = {"status": "unavailable", "error": type(error).__name__}
    is_ready = all(check.get("status") == "ok" for check in checks.values()) and len(checks) == 2
    return JSONResponse(
        status_code=200 if is_ready else 503,
        content={"status": "ready" if is_ready else "not_ready", "checks": checks},
    )
