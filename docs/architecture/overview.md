# Architecture overview

## Repository layout (D-01)

| Path | Responsibility | State |
|---|---|---|
| `frontend/` | Next.js 16 Control and Business portals | Existing UI shell. Demo fixtures in `demo` mode, backend adapters in `api` mode. |
| `backend/` | FastAPI modular monolith, API and worker entrypoints | Foundation, event store and provisional edge intake |
| `edge/` | Edge runtime (Jetson Nano target) | Crash-safe local event log and sync loop only |
| `contracts/` | Shared contracts | Provisional event envelope v1 |
| `docs/` | Documentation | This tree |
| `infrastructure/` | Local and deployment infrastructure | Local docker compose at the repo root. No provider chosen. |

## Backend layering

- `app/api/` is the only layer allowed to import FastAPI or Starlette. This is enforced by `tests/unit/test_architecture.py`.
- `app/core/` holds settings, logging, the database engine and the migration helpers.
- `app/modules/<module>/` holds framework-free domain modules. Modules never import `app.api`.
- `app/workers/` is the worker entrypoint. No jobs are registered yet.

Modules implemented so far:
- `eventstore`: append-only `ingested_events` and `quarantined_events`.
- `cvintake`: validation, device scoping and batch outcomes.

These modules have no code yet: identity and access, tenancy, provisioning, configuration, POS integration, reconciliation, ledger, findings, notifications, evidence, site operations and audit. They wait on their rules or on Domain 3.

## Responsibility split (spec ARC-2, ARC-6)

- **Edge:** observations, handover candidates, confirmations and reversals, health and gap events, clip references. The edge MUST NOT perform POS matching.
- **Backend:** POS lifecycle, reconciliation, matching, financial calculations, findings, offsets, qualification and finalisation.
