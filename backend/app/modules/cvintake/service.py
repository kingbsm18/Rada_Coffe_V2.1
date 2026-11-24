import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.modules.eventstore.envelope import EventEnvelopeV1
from app.modules.eventstore.service import ingest, quarantine

# Event families listed in ARC-2 (CONFIRMED). The type names are PROVISIONAL.
CV_EVENT_TYPES = frozenset(
    {
        "observation",
        "handover.candidate",
        "handover.confirmed",
        "handover.reversed",
        "inbound.unlinked",
        "device.health",
        "device.gap",
        "clip.reference",
    }
)

CHANNEL = "edge"

OutcomeStatus = Literal["accepted", "duplicate", "conflict", "quarantined"]


@dataclass(frozen=True)
class DeviceContext:
    """Scope an authenticated edge credential is bound to (ISO-2 safeguard 5)."""

    tenant_id: uuid.UUID
    establishment_id: uuid.UUID
    source_instance: str


@dataclass(frozen=True)
class EventOutcome:
    index: int
    status: OutcomeStatus
    event_id: str | None
    source_instance: str | None
    reason: str | None = None
    quarantine_id: uuid.UUID | None = None


def _identity(raw: Any) -> tuple[str | None, str | None]:
    if not isinstance(raw, dict):
        return None, None
    event_id, source = raw.get("event_id"), raw.get("source_instance")
    return (
        event_id if isinstance(event_id, str) else None,
        source if isinstance(source, str) else None,
    )


def _scope_errors(envelope: EventEnvelopeV1, device: DeviceContext) -> list[str]:
    errors = []
    if envelope.tenant_id != device.tenant_id:
        errors.append("tenant_id does not match the authenticated device")
    if envelope.establishment_id != device.establishment_id:
        errors.append("establishment_id does not match the authenticated device")
    if envelope.source_instance != device.source_instance:
        errors.append("source_instance does not match the authenticated device")
    return errors


def ingest_edge_batch(
    session: Session, device: DeviceContext, raw_events: list[Any], *, received_at: datetime
) -> list[EventOutcome]:
    """Validate, store or quarantine each event. The caller commits before acknowledging."""
    outcomes: list[EventOutcome] = []
    for index, raw in enumerate(raw_events):
        event_id, source = _identity(raw)

        def quarantined(reason: str, errors: Any, *, _i=index, _raw=raw, _e=event_id, _s=source):
            quarantine_id = quarantine(
                session,
                channel=CHANNEL,
                reason=reason,
                errors=errors,
                body=_raw,
                received_at=received_at,
                source_instance=_s,
                event_id=_e,
            )
            return EventOutcome(_i, "quarantined", _e, _s, reason, quarantine_id)

        try:
            envelope = EventEnvelopeV1.model_validate(raw)
        except ValidationError as error:
            outcomes.append(
                quarantined(
                    "invalid_envelope", error.errors(include_url=False, include_input=False)
                )
            )
            continue
        if scope_errors := _scope_errors(envelope, device):
            outcomes.append(quarantined("device_scope_mismatch", scope_errors))
            continue
        if envelope.event_type not in CV_EVENT_TYPES:
            outcomes.append(quarantined("unsupported_event_type", [envelope.event_type]))
            continue
        if envelope.model_version is None:
            outcomes.append(quarantined("missing_model_version", ["model_version is required"]))
            continue

        result = ingest(session, envelope, received_at=received_at)
        if result.status == "conflict":
            quarantine_id = quarantine(
                session,
                channel=CHANNEL,
                reason="event_id_conflict",
                errors=["event_id already stored with different content"],
                body=raw,
                received_at=received_at,
                source_instance=source,
                event_id=event_id,
            )
            outcomes.append(
                EventOutcome(
                    index, "conflict", event_id, source, "event_id_conflict", quarantine_id
                )
            )
        else:
            outcomes.append(EventOutcome(index, result.status, event_id, source))
    return outcomes


def summarize(outcomes: list[EventOutcome]) -> dict[str, int]:
    counts = Counter(outcome.status for outcome in outcomes)
    return {status: counts.get(status, 0) for status in OutcomeStatus.__args__}
