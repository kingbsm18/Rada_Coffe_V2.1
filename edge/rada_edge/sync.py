"""Acknowledgement-driven upload loop. The transport itself is not chosen (UNRESOLVED)."""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Protocol

from rada_edge.outbox import Outbox

# Backend outcomes meaning the event is durably held (stored, duplicate or quarantined).
DURABLE_OUTCOMES = frozenset({"accepted", "duplicate", "conflict", "quarantined"})


class EventSink(Protocol):
    def send(self, envelopes: list[dict[str, Any]]) -> Mapping[str, str]:
        """Deliver a batch; return ``{event_id: outcome}`` for events the backend persisted."""
        ...


@dataclass(frozen=True)
class DrainResult:
    sent: int
    acknowledged: int
    failed: bool


def drain_once(outbox: Outbox, sink: EventSink, *, batch_size: int) -> DrainResult:
    batch = outbox.pending(batch_size)
    if not batch:
        return DrainResult(0, 0, False)
    try:
        outcomes = sink.send([item.envelope for item in batch])
    except Exception:  # noqa: BLE001 - any transport failure leaves events queued
        return DrainResult(len(batch), 0, True)
    durable = [item.event_id for item in batch if outcomes.get(item.event_id) in DURABLE_OUTCOMES]
    acknowledged = outbox.mark_acknowledged(durable)
    return DrainResult(len(batch), acknowledged, len(durable) < len(batch))
