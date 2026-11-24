"""Immutable event store (ARC-1 envelope, ARC-5 idempotent ingestion).

Raw events are append-only: rows are never updated or deleted (R1 founding principle 3).
"""
