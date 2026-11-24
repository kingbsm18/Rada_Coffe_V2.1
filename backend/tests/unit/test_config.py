import pytest
from pydantic import ValidationError

from app.core.config import DEV_DATABASE_PASSWORD, Settings


def test_development_defaults_are_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("RADA_ENVIRONMENT", raising=False)
    settings = Settings(_env_file=None)
    assert settings.environment == "development"
    assert settings.is_development


def test_production_rejects_the_local_database_password() -> None:
    with pytest.raises(ValidationError, match="local development database password"):
        Settings(
            _env_file=None,
            environment="production",
            database_url=f"postgresql+psycopg://rada:{DEV_DATABASE_PASSWORD}@db/rada",
        )


def test_production_rejects_development_device_registry() -> None:
    with pytest.raises(ValidationError, match="RADA_EDGE_DEV_DEVICES"):
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql+psycopg://rada:strong@db/rada",
            edge_dev_devices="[]",
        )


def test_production_accepts_explicit_configuration() -> None:
    settings = Settings(
        _env_file=None, environment="production", database_url="postgresql+psycopg://u:p@db/rada"
    )
    assert not settings.is_development
