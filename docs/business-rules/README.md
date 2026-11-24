# Business rules

The authoritative source is the **RADA Coffee R1 Business Rules Specification**, RADA-COFFEE-R1-BR v1.0 (22 Nov 2026, freeze candidate).

The specification names `docs/business-rules/RADA_Coffee_R1_Business_Rules.tex` as its repository location. It is **not committed yet**, because this repository is public. Committing it is the decision authority's call.

## Rules implemented in this repository

| Rule | Status in spec | Implementation | Evidence |
|---|---|---|---|
| ARC-1 envelope fields | CONFIRMED | `EventEnvelopeV1` (names PROVISIONAL) | `backend/tests/unit/test_envelope.py` |
| ARC-4 crash-safe edge log, delete after ack plus margin | CONFIRMED | `edge/rada_edge/outbox.py`, `sync.py` | `edge/tests/` |
| ARC-5 idempotent ingestion, gap detection, quarantine | CONFIRMED | `backend/app/modules/eventstore`, `cvintake` | `backend/tests/integration/test_edge_events.py` |
| 2.2(3) raw events immutable | CONFIRMED | Append-only triggers (migration `0001`) | `test_event_tables_are_append_only` |
| Scenario DU4: edge batch resent after a lost ack | CONFIRMED | Idempotent intake | `test_resent_batch_after_lost_ack_is_idempotent` |

No matching, finding, offset, financial, qualification or configuration-versioning rule is implemented yet.
