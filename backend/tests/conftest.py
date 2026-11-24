import os
import uuid
from collections.abc import Iterator
from dataclasses import dataclass

import pytest
from alembic import command
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import make_url

from app.api.app import create_app
from app.core.config import Settings
from app.core.db import alembic_config

TEST_DATABASE_URL = os.environ.get("RADA_TEST_DATABASE_URL")
DEVICE_KEY = "dev-device-key-for-tests"


@dataclass(frozen=True)
class Device:
    key: str
    tenant_id: uuid.UUID
    establishment_id: uuid.UUID
    source_instance: str


def _sha256(value: str) -> str:
    import hashlib

    return hashlib.sha256(value.encode()).hexdigest()


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if TEST_DATABASE_URL:
        return
    skip = pytest.mark.skip(reason="RADA_TEST_DATABASE_URL is not set")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip)


@pytest.fixture(scope="session")
def database_url() -> Iterator[str]:
    assert TEST_DATABASE_URL
    url = make_url(TEST_DATABASE_URL)
    test_db = f"{url.database}_{uuid.uuid4().hex[:8]}"
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as connection:
        connection.execute(text(f'CREATE DATABASE "{test_db}"'))
    test_url = url.set(database=test_db).render_as_string(hide_password=False)
    try:
        yield test_url
    finally:
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{test_db}" WITH (FORCE)'))
        admin.dispose()


@pytest.fixture(scope="session")
def migrated_engine(database_url: str) -> Iterator[Engine]:
    config = alembic_config(database_url)
    config.attributes["configure_logger"] = False
    command.upgrade(config, "head")
    engine = create_engine(database_url)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def device() -> Device:
    return Device(DEVICE_KEY, uuid.uuid4(), uuid.uuid4(), f"edge-{uuid.uuid4().hex[:8]}")


@pytest.fixture(scope="session")
def other_device() -> Device:
    return Device("other-device-key", uuid.uuid4(), uuid.uuid4(), f"edge-{uuid.uuid4().hex[:8]}")


def _settings(default_database_url: str, devices: list[Device], **overrides) -> Settings:
    import json

    registry = [
        {
            "key_sha256": _sha256(d.key),
            "tenant_id": str(d.tenant_id),
            "establishment_id": str(d.establishment_id),
            "source_instance": d.source_instance,
        }
        for d in devices
    ]
    values = {
        "environment": "test",
        "database_url": default_database_url,
        "log_format": "console",
        "edge_dev_devices": json.dumps(registry),
        "edge_max_batch_size": 50,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


@pytest.fixture
def make_client(migrated_engine: Engine, database_url: str, device: Device, other_device: Device):
    def factory(**overrides) -> TestClient:
        settings = _settings(database_url, [device, other_device], **overrides)
        return TestClient(create_app(settings, migrated_engine))

    return factory


@pytest.fixture
def client(make_client) -> TestClient:
    return make_client()
