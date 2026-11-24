import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.eventstore.envelope import EventEnvelopeV1
from app.modules.eventstore.models import IngestedEvent, QuarantinedEvent

IngestStatus = Literal["accepted", "duplicate", "conflict"]


@dataclass(frozen=True)
class IngestResult:
    status: IngestStatus
    stored_id: uuid.UUID | None


@dataclass(frozen=True)
class SequenceGap:
    first_missing: int
    last_missing: int


def contains_nul(value: Any) -> bool:
    """PostgreSQL text and jsonb cannot store U+0000."""
    if isinstance(value, str):
        return "\x00" in value
    if isinstance(value, dict):
        return any(contains_nul(k) or contains_nul(v) for k, v in value.items())
    if isinstance(value, list):
        return any(contains_nul(item) for item in value)
    return False


def _storable_json(value: Any) -> Any:
    encoded = json.dumps(value, default=str)
    if contains_nul(value):
        return {"_json_text": encoded}
    return json.loads(encoded)


def _storable_text(value: Any) -> str | None:
    if isinstance(value, str) and "\x00" not in value:
        return value[:128]
    return None


def content_digest(envelope: EventEnvelopeV1) -> str:
    canonical = json.dumps(envelope.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def ingest(session: Session, envelope: EventEnvelopeV1, *, received_at: datetime) -> IngestResult:
    """Append an event once per (source_instance, event_id). Does not commit."""
    digest = content_digest(envelope)
    statement = (
        insert(IngestedEvent)
        .values(
            tenant_id=envelope.tenant_id,
            establishment_id=envelope.establishment_id,
            source_instance=envelope.source_instance,
            event_id=envelope.event_id,
            sequence=envelope.sequence,
            event_type=envelope.event_type,
            schema_version=envelope.schema_version,
            source_time=envelope.source_time,
            edge_recorded_at=envelope.edge_recorded_at,
            received_at=received_at,
            config_version=envelope.config_version,
            model_version=envelope.model_version,
            payload=envelope.payload,
            raw_payload=envelope.raw_payload,
            content_sha256=digest,
        )
        .on_conflict_do_nothing(constraint="uq_ingested_events_source_event")
        .returning(IngestedEvent.id)
    )
    stored_id = session.execute(statement).scalar_one_or_none()
    if stored_id is not None:
        return IngestResult("accepted", stored_id)
    existing_digest = session.execute(
        select(IngestedEvent.content_sha256).where(
            IngestedEvent.source_instance == envelope.source_instance,
            IngestedEvent.event_id == envelope.event_id,
        )
    ).scalar_one()
    return IngestResult("duplicate" if existing_digest == digest else "conflict", None)


def quarantine(
    session: Session,
    *,
    channel: str,
    reason: str,
    errors: Any,
    body: Any,
    received_at: datetime,
    source_instance: str | None = None,
    event_id: str | None = None,
) -> uuid.UUID:
    """Keep an invalid or conflicting submission instead of discarding it. Does not commit."""
    record = QuarantinedEvent(
        channel=channel,
        reason=reason,
        errors=_storable_json(errors),
        body=_storable_json(body),
        received_at=received_at,
        source_instance=_storable_text(source_instance),
        event_id=_storable_text(event_id),
    )
    session.add(record)
    session.flush()
    return record.id


def find_sequence_gaps(session: Session, source_instance: str) -> list[SequenceGap]:
    rows = session.execute(
        text(
            """
            SELECT previous + 1 AS first_missing, sequence - 1 AS last_missing
            FROM (
                SELECT sequence, LAG(sequence) OVER (ORDER BY sequence) AS previous
                FROM (SELECT DISTINCT sequence FROM ingested_events
                      WHERE source_instance = :source_instance) AS s
            ) AS ordered
            WHERE previous IS NOT NULL AND sequence - previous > 1
            ORDER BY first_missing
            """
        ),
        {"source_instance": source_instance},
    ).all()
    return [SequenceGap(row.first_missing, row.last_missing) for row in rows]
