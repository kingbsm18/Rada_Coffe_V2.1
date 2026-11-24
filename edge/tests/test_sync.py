from datetime import datetime, timezone

from rada_edge.envelope import SourceIdentity
from rada_edge.outbox import Outbox
from rada_edge.sync import drain_once

IDENTITY = SourceIdentity("t", "e", "edge-01")
T0 = datetime(2026, 11, 25, 9, 0, tzinfo=timezone.utc)


class RecordingSink:
    def __init__(self, outcome: str = "accepted", fail: bool = False, skip: int = 0) -> None:
        self.batches: list[list[dict]] = []
        self.outcome, self.fail, self.skip = outcome, fail, skip

    def send(self, envelopes):
        self.batches.append(envelopes)
        if self.fail:
            raise ConnectionError("backend unreachable")
        return {e["event_id"]: self.outcome for e in envelopes[self.skip :]}


def fill(outbox: Outbox, count: int) -> None:
    for _ in range(count):
        outbox.append(
            IDENTITY,
            event_type="observation",
            source_time=T0,
            config_version="c",
            model_version="m",
            payload={},
        )


def test_events_are_acknowledged_after_backend_outcome(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        fill(outbox, 3)
        result = drain_once(outbox, RecordingSink(), batch_size=10)
        assert (result.sent, result.acknowledged, result.failed) == (3, 3, False)
        assert outbox.pending_count() == 0


def test_transport_failure_keeps_events_queued_for_ordered_replay(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        fill(outbox, 2)
        failing = RecordingSink(fail=True)
        assert drain_once(outbox, failing, batch_size=10).failed
        assert outbox.pending_count() == 2
        healthy = RecordingSink(outcome="duplicate")
        drain_once(outbox, healthy, batch_size=10)
        assert healthy.batches[0] == failing.batches[0]
        assert outbox.pending_count() == 0


def test_events_missing_from_the_response_stay_pending(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        fill(outbox, 3)
        result = drain_once(outbox, RecordingSink(skip=1), batch_size=10)
        assert (result.acknowledged, result.failed) == (2, True)
        assert outbox.pending_count() == 1


def test_unknown_outcome_is_not_treated_as_durable(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        fill(outbox, 1)
        result = drain_once(outbox, RecordingSink(outcome="rejected"), batch_size=10)
        assert result.acknowledged == 0


def test_batches_respect_the_size_limit(tmp_path) -> None:
    with Outbox(tmp_path / "o.db") as outbox:
        fill(outbox, 5)
        sink = RecordingSink()
        drain_once(outbox, sink, batch_size=2)
        assert len(sink.batches[0]) == 2 and outbox.pending_count() == 3
