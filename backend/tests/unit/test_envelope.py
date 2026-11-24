import uuid
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.modules.eventstore.envelope import EventEnvelopeV1
from app.modules.eventstore.service import content_digest


def envelope(**overrides) -> dict:
    now = datetime(2026, 11, 25, 9, 30, tzinfo=UTC).isoformat()
    values = {
        "event_id": "evt-1",
        "tenant_id": str(uuid.uuid4()),
        "establishment_id": str(uuid.uuid4()),
        "source_instance": "edge-01",
        "sequence": 1,
        "event_type": "observation",
        "schema_version": "1",
        "source_time": now,
        "edge_recorded_at": now,
        "config_version": "cfg-1",
        "model_version": "model-1",
        "payload": {},
    }
    values.update(overrides)
    return values


def test_valid_envelope_parses() -> None:
    parsed = EventEnvelopeV1.model_validate(envelope())
    assert parsed.sequence == 1


@pytest.mark.parametrize(
    "overrides",
    [
        {"source_time": "2026-11-25T09:30:00"},
        {"sequence": -1},
        {"event_id": ""},
        {"event_id": "has spaces"},
        {"unexpected": True},
        {"payload": []},
        {"tenant_id": "not-a-uuid"},
    ],
)
def test_invalid_envelopes_are_rejected(overrides: dict) -> None:
    with pytest.raises(ValidationError):
        EventEnvelopeV1.model_validate(envelope(**overrides))


def test_digest_ignores_key_order_but_not_content() -> None:
    base = envelope(payload={"a": 1, "b": 2})
    same = envelope(payload={"b": 2, "a": 1})
    same.update({k: base[k] for k in ("tenant_id", "establishment_id")})
    changed = dict(same, payload={"a": 1, "b": 3})
    digest = content_digest(EventEnvelopeV1.model_validate(base))
    assert digest == content_digest(EventEnvelopeV1.model_validate(same))
    assert digest != content_digest(EventEnvelopeV1.model_validate(changed))


@pytest.mark.parametrize(
    "overrides",
    [
        {"sequence": True},
        {"sequence": "3"},
        {"sequence": 3.0},
        {"source_time": 1795600000},
        {"edge_recorded_at": 1795600000.5},
    ],
)
def test_wire_types_are_not_coerced(overrides) -> None:
    with pytest.raises(ValidationError):
        EventEnvelopeV1.model_validate(envelope(**overrides))
