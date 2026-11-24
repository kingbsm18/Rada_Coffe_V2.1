import pytest
from alembic import command
from sqlalchemy import create_engine, inspect

from app.core.db import alembic_config, current_migration_revision, expected_migration_head
from app.workers.main import run_once

pytestmark = pytest.mark.integration


def test_downgrade_and_upgrade_round_trip(database_url, migrated_engine) -> None:
    config = alembic_config(database_url)
    config.attributes["configure_logger"] = False
    command.downgrade(config, "base")
    assert "ingested_events" not in inspect(migrated_engine).get_table_names()
    command.upgrade(config, "head")
    assert current_migration_revision(migrated_engine) == expected_migration_head()
    assert {"ingested_events", "quarantined_events"} <= set(
        inspect(migrated_engine).get_table_names()
    )


def test_worker_tick_runs_registered_jobs(migrated_engine) -> None:
    calls = []
    result = run_once(migrated_engine, [lambda engine: calls.append(engine)])
    assert result.database_ok and result.jobs_run == 1
    assert calls == [migrated_engine]


def test_worker_reports_unavailable_database() -> None:
    engine = create_engine(
        "postgresql+psycopg://nobody:nothing@127.0.0.1:1/none", connect_args={"connect_timeout": 1}
    )
    assert run_once(engine, []).database_ok is False
