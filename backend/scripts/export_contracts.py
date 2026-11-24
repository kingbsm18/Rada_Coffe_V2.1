"""Regenerate contracts/edge-events/v1/envelope.schema.json from the backend model."""

import json
import sys
from pathlib import Path

from app.modules.eventstore.envelope import EventEnvelopeV1

CONTRACT_PATH = (
    Path(__file__).resolve().parents[2]
    / "contracts"
    / "edge-events"
    / "v1"
    / "envelope.schema.json"
)


def render() -> str:
    schema = {"$schema": "https://json-schema.org/draft/2020-12/schema"}
    schema.update(EventEnvelopeV1.model_json_schema())
    return json.dumps(schema, indent=2, sort_keys=True) + "\n"


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(0 if CONTRACT_PATH.read_text() == render() else 1)
    CONTRACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTRACT_PATH.write_text(render())
    print(f"wrote {CONTRACT_PATH}")
