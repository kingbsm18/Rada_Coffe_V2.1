import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, Index, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class IngestedEvent(Base):
    __tablename__ = "ingested_events"
    __table_args__ = (
        UniqueConstraint("source_instance", "event_id", name="uq_ingested_events_source_event"),
        Index("ix_ingested_events_source_sequence", "source_instance", "sequence"),
        Index("ix_ingested_events_scope_time", "tenant_id", "establishment_id", "source_time"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    establishment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    source_instance: Mapped[str] = mapped_column(String(128))
    event_id: Mapped[str] = mapped_column(String(128))
    sequence: Mapped[int] = mapped_column(BigInteger)
    event_type: Mapped[str] = mapped_column(String(64))
    schema_version: Mapped[str] = mapped_column(String(32))
    source_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    edge_recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    config_version: Mapped[str] = mapped_column(String(128))
    model_version: Mapped[str | None] = mapped_column(String(128))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    content_sha256: Mapped[str] = mapped_column(String(64))


class QuarantinedEvent(Base):
    __tablename__ = "quarantined_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    channel: Mapped[str] = mapped_column(String(32))
    reason: Mapped[str] = mapped_column(String(64))
    source_instance: Mapped[str | None] = mapped_column(String(128))
    event_id: Mapped[str | None] = mapped_column(String(128))
    errors: Mapped[Any] = mapped_column(JSONB)
    body: Mapped[Any] = mapped_column(JSONB)
    note: Mapped[str | None] = mapped_column(Text)
