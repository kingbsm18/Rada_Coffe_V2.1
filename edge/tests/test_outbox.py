from datetime import datetime, timedelta, timezone

import pytest

from rada_edge.envelope import SourceIdentity
from rada_edge.outbox import Outbox, OutboxFull

IDENTITY = SourceIdentity(
    "00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002", "edge-01"
)
T0 = datetime(2026, 11, 25, 9, 0, tzinfo=timezone.utc)


class Clock:
    def __init__(self) -> None:
        self.now = T0

    def __call__(self) -> datetime:
        return self.now


def append(outbox: Outbox, identity: SourceIdentity = IDENTITY) -> dict:
    return outbox.append(
        identity,
        event_type="observation",
        source_time=T0,
        config_version="cfg-1",
        model_version="model-1",
        payload={},
    )


def test_events_survive_reopen_and_sequence_continues(tmp_path) -> None:
    path = tmp_path / "outbox.db"
    with Outbox(path) as outbox:
        first = append(outbox)
        second = append(outbox)
    with Outbox(path) as outbox:
        third = append(outbox)
        pending = outbox.pending(10)
    assert [first["sequence"], second["sequence"], third["sequence"]] == [1, 2, 3]
    assert [item.event_id for item in pending] == [e["event_id"] for e in (first, second, third)]


def test_sequences_are_independent_per_source_instance(tmp_path) -> None:
    other = SourceIdentity(IDENTITY.tenant_id, IDENTITY.establishment_id, "edge-02")
    with Outbox(tmp_path / "o.db") as outbox:
        assert append(outbox)["sequence"] == 1
        assert append(outbox, other)["sequence"] == 1
        assert append(outbox)["sequence"] == 2


def test_envelope_carries_arc1_fields(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        envelope = append(outbox)
    assert set(envelope) == {
        "event_id",
        "tenant_id",
        "establishment_id",
        "source_instance",
        "sequence",
        "event_type",
        "schema_version",
        "source_time",
        "edge_recorded_at",
        "config_version",
        "model_version",
        "payload",
    }


def test_acknowledged_events_are_deleted_only_after_the_margin(tmp_path) -> None:
    clock = Clock()
    with Outbox(tmp_path / "o.db", clock=clock) as outbox:
        event = append(outbox)
        assert outbox.purge_acknowledged(timedelta(0)) == 0
        assert outbox.mark_acknowledged([event["event_id"]]) == 1
        assert outbox.pending_count() == 0
        clock.now = T0 + timedelta(minutes=5)
        assert outbox.purge_acknowledged(timedelta(minutes=10)) == 0
        clock.now = T0 + timedelta(minutes=11)
        assert outbox.purge_acknowledged(timedelta(minutes=10)) == 1


def test_acknowledgement_is_idempotent(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        event = append(outbox)
        assert outbox.mark_acknowledged([event["event_id"]]) == 1
        assert outbox.mark_acknowledged([event["event_id"]]) == 0


def test_optional_queue_limit_rejects_without_losing_sequence(tmp_path) -> None:
    with Outbox(tmp_path / "o.db", max_pending=1) as outbox:
        append(outbox)
        with pytest.raises(OutboxFull):
            append(outbox)
        outbox.mark_acknowledged([outbox.pending(1)[0].event_id])
        assert append(outbox)["sequence"] == 2


def test_naive_timestamps_are_rejected(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox, pytest.raises(ValueError):
        outbox.append(
            IDENTITY,
            event_type="observation",
            source_time=T0.replace(tzinfo=None),
            config_version="c",
            model_version="m",
            payload={},
        )
    with Outbox(tmp_path / "o.db") as outbox:
        assert outbox.pending_count() == 0
