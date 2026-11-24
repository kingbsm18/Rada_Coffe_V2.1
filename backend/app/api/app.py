from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Engine

from app import __version__
from app.api import health, v1
from app.api.errors import register_error_handlers
from app.api.middleware import RequestContextMiddleware
from app.api.v1.edge.device_auth import build_device_resolver
from app.core.config import Settings, get_settings
from app.core.db import get_engine
from app.core.logging import configure_logging


def create_app(settings: Settings | None = None, engine: Engine | None = None) -> FastAPI:
    """API composition root."""
    settings = settings or get_settings()
    configure_logging(settings.log_level, settings.log_format)
    app = FastAPI(
        title="RADA Coffee API",
        version=__version__,
        docs_url="/docs" if settings.is_development else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.is_development else None,
    )
    app.state.settings = settings
    app.state.engine = engine or get_engine(settings.database_url)
    app.state.device_resolver = build_device_resolver(settings)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )
    app.add_middleware(RequestContextMiddleware)
    register_error_handlers(app)
    app.include_router(health.router)
    app.include_router(v1.router)
    return app
