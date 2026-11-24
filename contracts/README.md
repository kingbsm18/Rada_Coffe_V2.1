# Contracts

Shared contracts between `edge/`, `backend/` and `frontend/`.

| Contract | Path | Status | Source of truth |
|---|---|---|---|
| Event envelope v1 | `edge-events/v1/envelope.schema.json` | **PROVISIONAL** | Generated from `backend/app/modules/eventstore/envelope.py` |
| Edge intake API | `POST /v1/edge/events` (see below) | **PROVISIONAL** | `backend/app/api/v1/edge/events.py` |

The envelope fields come from ARC-1 (CONFIRMED) in the R1 Business Rules Specification v1.0. These are implementation choices, not approved decisions:

- the field names and types,
- the reading of "per-stream sequence" as one stream per `source_instance`,
- the event-type names.

They must be reconciled with the Edge Runtime architecture document when it is available. Payloads are stored uninterpreted. No HR (handover) semantics are defined here.

Regenerate the schema after changing the model:

```bash
cd backend && python -m scripts.export_contracts        # write
cd backend && python -m scripts.export_contracts --check # CI drift check
```

## Edge intake (PROVISIONAL)

`POST /v1/edge/events` with header `X-RADA-Device-Key` and body `{"events": [<envelope>, ...]}`.

- **Idempotency:** on `(source_instance, event_id)` (ARC-5). A resent event returns `duplicate`.
- **Conflict:** the same key with different content returns `conflict` and the submission is quarantined.
- **Quarantine:** invalid events are quarantined, never discarded, and return `quarantined` with a `quarantine_id`.
- **Acknowledgement:** a 200 response is sent only after the database commit. On `503 not_persisted` the edge must retry the whole batch.
- **Device scope:** the envelope's tenant, establishment and source instance must match the authenticated device (ISO-2 safeguard 5).
- **Statuses:** `accepted`, `duplicate`, `conflict` and `quarantined` all mean the backend holds the submission durably, so the edge may acknowledge it locally.
- **Sequence gaps:** sequences start at 1. `GET /v1/edge/sequence-gaps` reports missing ranges (including before the first received event) for the authenticated device's tenant, establishment and source instance.
- **Limits:** at most `RADA_EDGE_MAX_BATCH_SIZE` events and `RADA_EDGE_MAX_BODY_BYTES` bytes per request (413 otherwise). Strings containing U+0000 are quarantined (PostgreSQL cannot store them).
