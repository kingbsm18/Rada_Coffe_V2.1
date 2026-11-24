"""Builds the PROVISIONAL v1 event envelope (fields per ARC-1)."""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class SourceIdentity:
    tenant_id: str
    establishment_id: str
    source_instance: str


def build_envelope(
    identity: SourceIdentity,
    *,
    sequence: int,
    event_type: str,
    source_time: datetime,
    recorded_at: datetime,
    config_version: str,
    model_version: str | None,
    payload: dict[str, Any],
    schema_version: str = "1",
    event_id: str | None = None,
) -> dict[str, Any]:
    if source_time.tzinfo is None or recorded_at.tzinfo is None:
        raise ValueError("timestamps must be timezone-aware")
    return {
        "event_id": event_id or str(uuid.uuid4()),
        "tenant_id": identity.tenant_id,
        "establishment_id": identity.establishment_id,
        "source_instance": identity.source_instance,
        "sequence": sequence,
        "event_type": event_type,
        "schema_version": schema_version,
        "source_time": source_time.astimezone(timezone.utc).isoformat(),
        "edge_recorded_at": recorded_at.astimezone(timezone.utc).isoformat(),
        "config_version": config_version,
        "model_version": model_version,
        "payload": payload,
    }
