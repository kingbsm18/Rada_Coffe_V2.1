"""Crash-safe local event log (ARC-4).

An event counts as recorded only once its transaction is durably committed (SQLite WAL with
synchronous=FULL). It is deleted only after backend acknowledgement plus a retention margin.
Sequence numbers are monotonic per source instance and survive restarts. Queue limits are
UNVALIDATED, so no default limit is imposed.
"""

import json
import sqlite3
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from rada_edge.envelope import SourceIdentity, build_envelope

SCHEMA = """
CREATE TABLE IF NOT EXISTS stream_sequence (
    source_instance TEXT PRIMARY KEY,
    last_sequence INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
    position INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,
    source_instance TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    envelope TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    acked_at TEXT,
    UNIQUE (source_instance, sequence)
);
CREATE INDEX IF NOT EXISTS ix_outbox_pending ON outbox (acked_at, position);
"""


class OutboxFull(RuntimeError):
    pass


@dataclass(frozen=True)
class PendingEvent:
    position: int
    event_id: str
    envelope: dict[str, Any]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Outbox:
    def __init__(
        self,
        path: str | Path,
        *,
        max_pending: int | None = None,
        clock: Callable[[], datetime] = _utc_now,
    ) -> None:
        self._connection = sqlite3.connect(str(path), isolation_level=None)
        self._connection.execute("PRAGMA journal_mode=WAL")
        self._connection.execute("PRAGMA synchronous=FULL")
        self._connection.executescript(SCHEMA)
        self._max_pending = max_pending
        self._clock = clock

    def close(self) -> None:
        self._connection.close()

    def __enter__(self) -> "Outbox":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def append(
        self,
        identity: SourceIdentity,
        *,
        event_type: str,
        source_time: datetime,
        config_version: str,
        model_version: str | None,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Assign the next sequence number and durably record the event."""
        connection = self._connection
        connection.execute("BEGIN IMMEDIATE")
        try:
            if self._max_pending is not None and self.pending_count() >= self._max_pending:
                raise OutboxFull("event log is full")
            row = connection.execute(
                "SELECT last_sequence FROM stream_sequence WHERE source_instance = ?",
                (identity.source_instance,),
            ).fetchone()
            sequence = (row[0] + 1) if row else 1
            connection.execute(
                "INSERT INTO stream_sequence (source_instance, last_sequence) VALUES (?, ?) "
                "ON CONFLICT (source_instance) "
                "DO UPDATE SET last_sequence = excluded.last_sequence",
                (identity.source_instance, sequence),
            )
            recorded_at = self._clock()
            envelope = build_envelope(
                identity,
                sequence=sequence,
                event_type=event_type,
                source_time=source_time,
                recorded_at=recorded_at,
                config_version=config_version,
                model_version=model_version,
                payload=payload,
            )
            connection.execute(
                "INSERT INTO outbox (event_id, source_instance, sequence, envelope, recorded_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    envelope["event_id"],
                    identity.source_instance,
                    sequence,
                    json.dumps(envelope, sort_keys=True),
                    recorded_at.isoformat(),
                ),
            )
            connection.execute("COMMIT")
        except BaseException:
            connection.execute("ROLLBACK")
            raise
        return envelope

    def pending(self, limit: int) -> list[PendingEvent]:
        rows = self._connection.execute(
            "SELECT position, event_id, envelope FROM outbox WHERE acked_at IS NULL "
            "ORDER BY position LIMIT ?",
            (limit,),
        ).fetchall()
        return [PendingEvent(row[0], row[1], json.loads(row[2])) for row in rows]

    def pending_count(self) -> int:
        return self._connection.execute(
            "SELECT COUNT(*) FROM outbox WHERE acked_at IS NULL"
        ).fetchone()[0]

    def mark_acknowledged(self, event_ids: Iterable[str]) -> int:
        now = self._clock().isoformat()
        ids = list(event_ids)
        self._connection.execute("BEGIN IMMEDIATE")
        try:
            changed = self._connection.executemany(
                "UPDATE outbox SET acked_at = ? WHERE event_id = ? AND acked_at IS NULL",
                [(now, event_id) for event_id in ids],
            ).rowcount
            self._connection.execute("COMMIT")
        except BaseException:
            self._connection.execute("ROLLBACK")
            raise
        return changed

    def purge_acknowledged(self, margin: timedelta) -> int:
        """Delete events acknowledged longer ago than ``margin``."""
        cutoff = (self._clock() - margin).isoformat()
        return self._connection.execute(
            "DELETE FROM outbox WHERE acked_at IS NOT NULL AND acked_at <= ?", (cutoff,)
        ).rowcount
