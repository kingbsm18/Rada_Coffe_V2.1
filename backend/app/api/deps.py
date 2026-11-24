from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.db import session_factory


def get_settings_dep(request: Request) -> Settings:
    return request.app.state.settings


def get_engine_dep(request: Request) -> Engine:
    return request.app.state.engine


def get_session(request: Request) -> Iterator[Session]:
    with session_factory(request.app.state.engine)() as session:
        yield session
