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
        errors=json.loads(json.dumps(errors, default=str)),
        body=json.loads(json.dumps(body, default=str)),
        received_at=received_at,
        source_instance=source_instance[:128] if isinstance(source_instance, str) else None,
        event_id=event_id[:128] if isinstance(event_id, str) else None,
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
