import hashlib
import json
import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError, OperationalError
from sqlalchemy.orm import Session

from app.modules.eventstore.models import IngestedEvent, QuarantinedEvent

pytestmark = pytest.mark.integration


def event(device, sequence: int, **overrides) -> dict:
    now = datetime.now(UTC).isoformat()
    values = {
        "event_id": f"{device.source_instance}-{uuid.uuid4().hex}",
        "tenant_id": str(device.tenant_id),
        "establishment_id": str(device.establishment_id),
        "source_instance": device.source_instance,
        "sequence": sequence,
        "event_type": "observation",
        "schema_version": "1",
        "source_time": now,
        "edge_recorded_at": now,
        "config_version": "cfg-1",
        "model_version": "model-1",
        "payload": {"opaque": True},
    }
    values.update(overrides)
    return values


def post(client, device, events, key=None):
    return client.post(
        "/v1/edge/events",
        json={"events": events},
        headers={"X-RADA-Device-Key": key or device.key},
    )


def stored_count(engine, source_instance: str) -> int:
    with Session(engine) as session:
        return session.scalar(
            select(func.count()).where(IngestedEvent.source_instance == source_instance)
        )


def quarantined(engine, quarantine_id: str) -> QuarantinedEvent:
    with Session(engine) as session:
        return session.get(QuarantinedEvent, uuid.UUID(quarantine_id))


def test_requires_a_device_credential(client, device) -> None:
    response = client.post("/v1/edge/events", json={"events": [event(device, 1)]})
    assert response.status_code == 401
    assert post(client, device, [event(device, 1)], key="wrong").status_code == 401


def test_edge_auth_is_refused_outside_development(make_client, device) -> None:
    client = make_client(
        environment="staging",
        database_url="postgresql+psycopg://user:strong@localhost/unused",
        edge_dev_devices="",
    )
    assert post(client, device, [event(device, 1)]).status_code == 503


def test_accepts_and_persists_before_acknowledging(client, device, migrated_engine) -> None:
    events = [event(device, 1), event(device, 2)]
    response = post(client, device, events)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["summary"]["accepted"] == 2
    assert [r["status"] for r in body["results"]] == ["accepted", "accepted"]
    with Session(migrated_engine) as session:
        row = session.scalar(
            select(IngestedEvent).where(IngestedEvent.event_id == events[0]["event_id"])
        )
        assert row is not None
        assert row.payload == {"opaque": True}
        assert row.received_at.tzinfo is not None


def test_resent_batch_after_lost_ack_is_idempotent(client, device, migrated_engine) -> None:
    """DU4: an edge batch resent after a lost acknowledgement."""
    events = [event(device, 10), event(device, 11)]
    assert post(client, device, events).json()["summary"]["accepted"] == 2
    before = stored_count(migrated_engine, device.source_instance)
    response = post(client, device, events)
    assert response.json()["summary"] == {
        "accepted": 0,
        "duplicate": 2,
        "conflict": 0,
        "quarantined": 0,
    }
    assert stored_count(migrated_engine, device.source_instance) == before


def test_duplicate_within_one_batch_is_stored_once(client, device) -> None:
    item = event(device, 20)
    statuses = [r["status"] for r in post(client, device, [item, item]).json()["results"]]
    assert statuses == ["accepted", "duplicate"]


def test_same_event_id_with_different_content_is_a_conflict(
    client, device, migrated_engine
) -> None:
    original = event(device, 30)
    post(client, device, [original])
    altered = dict(original, payload={"opaque": False})
    result = post(client, device, [altered]).json()["results"][0]
    assert result["status"] == "conflict"
    assert quarantined(migrated_engine, result["quarantine_id"]).reason == "event_id_conflict"


def test_invalid_events_are_quarantined_not_discarded(client, device, migrated_engine) -> None:
    good = event(device, 40)
    bad = event(device, 41, source_time="2026-11-25T09:30:00")
    response = post(client, device, [good, bad, "not-an-object"])
    results = response.json()["results"]
    assert [r["status"] for r in results] == ["accepted", "quarantined", "quarantined"]
    record = quarantined(migrated_engine, results[1]["quarantine_id"])
    assert record.reason == "invalid_envelope"
    assert record.body["event_id"] == bad["event_id"]


def test_events_outside_the_device_scope_are_quarantined(client, device, other_device) -> None:
    foreign = event(other_device, 1)
    result = post(client, device, [foreign]).json()["results"][0]
    assert (result["status"], result["reason"]) == ("quarantined", "device_scope_mismatch")


def test_unknown_event_type_and_missing_model_version(client, device) -> None:
    results = post(
        client,
        device,
        [event(device, 50, event_type="pos.sale"), event(device, 51, model_version=None)],
    ).json()["results"]
    assert [r["reason"] for r in results] == ["unsupported_event_type", "missing_model_version"]


def test_malformed_batch_body_is_quarantined(client, device, migrated_engine) -> None:
    response = client.post(
        "/v1/edge/events",
        content=b"{not json",
        headers={"X-RADA-Device-Key": device.key, "Content-Type": "application/json"},
    )
    assert response.status_code == 422
    record = quarantined(migrated_engine, response.json()["details"]["quarantine_id"])
    assert record.reason == "invalid_batch"


def test_batch_limits(client, device) -> None:
    assert post(client, device, []).status_code == 422
    too_many = [event(device, i) for i in range(51)]
    response = post(client, device, too_many)
    assert response.status_code == 413
    assert response.json()["details"] == {"max_batch_size": 50}


def test_oversized_body_is_rejected_before_parsing(make_client, device) -> None:
    client = make_client(edge_max_body_bytes=2048)
    response = post(client, device, [event(device, 1, payload={"blob": "x" * 4096})])
    assert response.status_code == 413
    assert response.json()["details"] == {"max_body_bytes": 2048}


def test_nul_character_is_quarantined_without_blocking_the_batch(
    client, device, migrated_engine
) -> None:
    bad = event(device, 90, payload={"note": "a\x00b"})
    response = post(client, device, [bad, event(device, 91)])
    assert response.status_code == 200, response.text
    results = response.json()["results"]
    assert [r["status"] for r in results] == ["quarantined", "accepted"]
    record = quarantined(migrated_engine, results[0]["quarantine_id"])
    assert record.reason == "unsupported_nul_character"
    assert "\\u0000" in record.body["_json_text"]


def test_malformed_body_with_nul_is_quarantined(client, device) -> None:
    response = client.post(
        "/v1/edge/events",
        content=b'{"events": "\x00"',
        headers={"X-RADA-Device-Key": device.key},
    )
    assert response.status_code == 422
    assert "quarantine_id" in response.json()["details"]


def test_sequence_gaps_are_detected(client, other_device) -> None:
    post(client, other_device, [event(other_device, s) for s in (1, 2, 5, 9)])
    response = client.get("/v1/edge/sequence-gaps", headers={"X-RADA-Device-Key": other_device.key})
    assert response.json()["gaps"] == [
        {"first_missing": 3, "last_missing": 4},
        {"first_missing": 6, "last_missing": 8},
    ]


def _isolated_client(make_client, *devices):
    registry = [
        {
            "key_sha256": hashlib.sha256(d.key.encode()).hexdigest(),
            "tenant_id": str(d.tenant_id),
            "establishment_id": str(d.establishment_id),
            "source_instance": d.source_instance,
        }
        for d in devices
    ]
    return make_client(edge_dev_devices=json.dumps(registry))


def _gaps(client, device):
    response = client.get("/v1/edge/sequence-gaps", headers={"X-RADA-Device-Key": device.key})
    return response.json()["gaps"]


def test_missing_events_at_stream_start_are_a_gap(make_client) -> None:
    late = SimpleNamespace(
        key="late-key",
        tenant_id=uuid.uuid4(),
        establishment_id=uuid.uuid4(),
        source_instance=f"edge-late-{uuid.uuid4().hex[:8]}",
    )
    client = _isolated_client(make_client, late)
    post(client, late, [event(late, 3)])
    assert _gaps(client, late) == [{"first_missing": 1, "last_missing": 2}]


def test_sequence_gaps_are_scoped_to_the_device(make_client) -> None:
    name = f"edge-shared-{uuid.uuid4().hex[:8]}"
    first, second = (
        SimpleNamespace(
            key=key, tenant_id=uuid.uuid4(), establishment_id=uuid.uuid4(), source_instance=name
        )
        for key in ("first-key", "second-key")
    )
    client = _isolated_client(make_client, first, second)
    post(client, first, [event(first, 1), event(first, 2)])
    post(client, second, [event(second, 4)])
    assert _gaps(client, first) == []


def test_out_of_order_arrival_is_accepted(client, device) -> None:
    results = post(client, device, [event(device, 62), event(device, 60), event(device, 61)]).json()
    assert results["summary"]["accepted"] == 3


@pytest.mark.parametrize(
    "statement",
    [
        "UPDATE ingested_events SET payload = '{}'::jsonb",
        "DELETE FROM ingested_events",
        "TRUNCATE ingested_events",
        "DELETE FROM quarantined_events",
    ],
)
def test_event_tables_are_append_only(client, device, migrated_engine, statement) -> None:
    post(client, device, [event(device, 70)])
    with migrated_engine.connect() as connection, pytest.raises(DBAPIError, match="append-only"):
        connection.execute(text(statement))


def test_failed_commit_is_not_acknowledged(client, device, migrated_engine, monkeypatch) -> None:
    def failing_commit(self):
        raise OperationalError("COMMIT", {}, Exception("simulated failure"))

    monkeypatch.setattr(Session, "commit", failing_commit)
    item = event(device, 80)
    response = post(client, device, [item])
    monkeypatch.undo()
    assert response.status_code == 503
    assert response.json()["code"] == "not_persisted"
    with Session(migrated_engine) as session:
        assert (
            session.scalar(select(IngestedEvent).where(IngestedEvent.event_id == item["event_id"]))
            is None
        )
