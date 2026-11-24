# Decision register

| ID | Decision | Status | Source |
|---|---|---|---|
| D-01 | One repository: frontend, backend, edge, contracts, docs and infrastructure live in `Rada_Coffe_V2.1` | APPROVED | Post-audit directive, 2026-11-24 |
| D-02 | `kingbsm18/RADA_Coffee` is not an implementation base; no code, rules or tests ported | APPROVED | Post-audit directive |
| D-03 | Branch `v0/frontend-wrapper` is not merged wholesale; extract improvements only after security review; its credentials are treated as compromised | APPROVED | Post-audit directive |
| D-04 | Missing documents are not invented; independent infrastructure proceeds | APPROVED | Post-audit directive |
| A-01 | Modular monolith, FastAPI composition root, separate API and worker entrypoints | Direction stated in the onboarding brief (Domain 1 record unavailable) | Brief |
| A-02 | Three API surfaces: Control, Business, Edge (mounted under `/v1/control`, `/v1/business`, `/v1/edge`) | Brief; route prefixes PROVISIONAL | Brief |
| R-ARC-1 | Event envelope fields | CONFIRMED in the spec; field names PROVISIONAL | Spec ARC-1 |
| R-ARC-4 | Edge crash-safe local log; delete only after ack plus margin | CONFIRMED | Spec ARC-4 |
| R-ARC-5 | Idempotent ingestion on (source instance, event ID); gap detection; quarantine | CONFIRMED | Spec ARC-5 |
| R-ISO-2 | Shared PostgreSQL with RLS | CONFIRMED in the spec; **implementation deferred until Domain 3 approval** | Spec ISO-2, directive §4 |
| T-01 | Python 3.12, SQLAlchemy 2, Alembic, psycopg 3 | PROVISIONAL (technical choice) | This repository |
| T-02 | Raw event tables are append-only, enforced by database triggers | PROVISIONAL implementation of founding principle 3 | Spec 2.2(3) |
| T-03 | Edge local log uses SQLite (WAL, synchronous=FULL) | PROVISIONAL | This repository |

## Unresolved

- Edge transport, stream and sequence identity, device credential lifecycle (Edge Runtime document).
- Tenant isolation and RLS design (Domain 3).
- Hosting provider and topology (spec Chapter 23).
- Realtime transport to the frontend (SSE or WebSocket).
- Whether both portals ship as one frontend deployment or two.
- CLAR-1 and CLAR-2 (spec 25.2).
