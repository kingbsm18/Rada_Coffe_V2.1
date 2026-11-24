"""Immutable event store and quarantine (ARC-1, ARC-5).

Revision ID: 0001_event_store
Revises:
Create Date: 2026-11-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_event_store"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APPEND_ONLY_TABLES = ("ingested_events", "quarantined_events")


def upgrade() -> None:
    op.create_table(
        "ingested_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("establishment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_instance", sa.String(128), nullable=False),
        sa.Column("event_id", sa.String(128), nullable=False),
        sa.Column("sequence", sa.BigInteger(), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("schema_version", sa.String(32), nullable=False),
        sa.Column("source_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("edge_recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("config_version", sa.String(128), nullable=False),
        sa.Column("model_version", sa.String(128), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("raw_payload", postgresql.JSONB(), nullable=True),
        sa.Column("content_sha256", sa.String(64), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_ingested_events"),
        sa.UniqueConstraint("source_instance", "event_id", name="uq_ingested_events_source_event"),
    )
    op.create_index(
        "ix_ingested_events_source_sequence", "ingested_events", ["source_instance", "sequence"]
    )
    op.create_index(
        "ix_ingested_events_scope_time",
        "ingested_events",
        ["tenant_id", "establishment_id", "source_time"],
    )

    op.create_table(
        "quarantined_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("channel", sa.String(32), nullable=False),
        sa.Column("reason", sa.String(64), nullable=False),
        sa.Column("source_instance", sa.String(128), nullable=True),
        sa.Column("event_id", sa.String(128), nullable=True),
        sa.Column("errors", postgresql.JSONB(), nullable=False),
        sa.Column("body", postgresql.JSONB(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_quarantined_events"),
    )

    op.execute(
        """
        CREATE FUNCTION rada_reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'table % is append-only', TG_TABLE_NAME
                USING ERRCODE = 'restrict_violation';
        END;
        $$;
        """
    )
    for table in APPEND_ONLY_TABLES:
        op.execute(
            f"CREATE TRIGGER {table}_append_only BEFORE UPDATE OR DELETE ON {table} "  # noqa: S608
            "FOR EACH ROW EXECUTE FUNCTION rada_reject_mutation()"
        )
        op.execute(
            f"CREATE TRIGGER {table}_no_truncate BEFORE TRUNCATE ON {table} "  # noqa: S608
            "FOR EACH STATEMENT EXECUTE FUNCTION rada_reject_mutation()"
        )


def downgrade() -> None:
    for table in APPEND_ONLY_TABLES:
        op.drop_table(table)
    op.execute("DROP FUNCTION rada_reject_mutation()")
