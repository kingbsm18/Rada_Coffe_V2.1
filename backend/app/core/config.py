from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "test", "staging", "production"]

DEV_DATABASE_PASSWORD = "rada_dev_password"  # noqa: S105 - local docker-compose only


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="RADA_", env_file=(".env", "../.env"), extra="ignore"
    )

    environment: Environment = "development"
    database_url: str = f"postgresql+psycopg://rada:{DEV_DATABASE_PASSWORD}@localhost:5432/rada"
    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "json"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    edge_max_batch_size: int = Field(default=500, ge=1, le=10_000)
    edge_dev_devices: str = ""
    worker_poll_interval_seconds: float = Field(default=5.0, gt=0)

    @property
    def is_development(self) -> bool:
        return self.environment in ("development", "test")

    @model_validator(mode="after")
    def _guard_non_development(self) -> "Settings":
        if self.is_development:
            return self
        if DEV_DATABASE_PASSWORD in self.database_url:
            raise ValueError("The local development database password cannot be used here.")
        if self.edge_dev_devices.strip():
            raise ValueError("RADA_EDGE_DEV_DEVICES is only allowed in development or test.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
