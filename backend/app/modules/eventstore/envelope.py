"""Event envelope, version 1.

Fields follow ARC-1 (CONFIRMED) of the R1 Business Rules Specification. Field names, types and
the interpretation of "per-stream sequence" (one stream per source instance) are PROVISIONAL
implementation choices pending the Edge Runtime architecture document.
"""

from typing import Any
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

ENVELOPE_SCHEMA_ID = "https://rada.ai/contracts/edge-events/v1/envelope.schema.json"

Identifier = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9._:\-]+$")


class EventEnvelopeV1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        title="RADA event envelope v1 (PROVISIONAL)",
        json_schema_extra={"$id": ENVELOPE_SCHEMA_ID},
    )

    event_id: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:\-]+$",
        description="Event ID generated at the source (ARC-1).",
    )
    tenant_id: UUID
    establishment_id: UUID
    source_instance: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:\-]+$",
        description="Source instance; together with event_id forms the idempotency key (ARC-5).",
    )
    sequence: int = Field(
        ge=0, description="Monotonic per-stream sequence number; stream = source_instance."
    )
    event_type: str = Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_.]*$")
    schema_version: str = Field(min_length=1, max_length=32)
    source_time: AwareDatetime = Field(description="Source-clock time (stored in UTC).")
    edge_recorded_at: AwareDatetime = Field(description="Time the edge recorded the event.")
    config_version: str = Field(min_length=1, max_length=128)
    model_version: str | None = Field(default=None, min_length=1, max_length=128)
    payload: dict[str, Any] = Field(description="Type-specific payload, stored uninterpreted.")
    raw_payload: dict[str, Any] | None = Field(
        default=None, description="Untouched raw source payload (POS events, ARC-1)."
    )
