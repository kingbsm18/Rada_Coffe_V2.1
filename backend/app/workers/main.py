"""Worker entrypoint.

No background jobs are registered yet. Reconciliation and finalisation jobs (ORD-1) will be added
once their rules are implemented. Correctness must not depend on in-process locks (A-03).
"""

import argparse
import logging
import signal
import threading
from collections.abc import Callable
from dataclasses import dataclass

from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.core.db import get_engine
from app.core.logging import configure_logging

logger = logging.getLogger("rada.worker")

Job = Callable[[Engine], None]
JOBS: list[Job] = []


@dataclass(frozen=True)
class TickResult:
    database_ok: bool
    jobs_run: int


def run_once(engine: Engine, jobs: list[Job] | None = None) -> TickResult:
    jobs = JOBS if jobs is None else jobs
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("worker_database_unavailable")
        return TickResult(database_ok=False, jobs_run=0)
    for job in jobs:
        job(engine)
    logger.info("worker_tick", extra={"jobs_registered": len(jobs)})
    return TickResult(database_ok=True, jobs_run=len(jobs))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="RADA backend worker")
    parser.add_argument("--once", action="store_true", help="run a single tick and exit")
    args = parser.parse_args(argv)

    settings = get_settings()
    configure_logging(settings.log_level, settings.log_format)
    engine = get_engine(settings.database_url)
    if args.once:
        return 0 if run_once(engine).database_ok else 1

    stop = threading.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())
    logger.info("worker_started", extra={"poll_seconds": settings.worker_poll_interval_seconds})
    while not stop.is_set():
        run_once(engine)
        stop.wait(settings.worker_poll_interval_seconds)
    logger.info("worker_stopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
