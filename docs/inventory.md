# Documentation inventory

Last updated: 2026-11-24.

## Available authoritative documents

| Document | ID / version | Status | Location | Notes |
|---|---|---|---|---|
| RADA Coffee R1 Business Rules Specification | RADA-COFFEE-R1-BR v1.0, 22 Nov 2026 | Specification-freeze candidate. Freeze not yet declared (Chapter 25). | Provided by the decision authority (PDF). **Not committed**, because this repository is public. | Each rule carries its own status. The spec says implementation may begin on the tenant model with RLS, authentication, immutable idempotent ingestion, canonical POS events, the audit log and versioned configuration (25.4). |

## Missing authoritative documents

| Document | Needed for |
|---|---|
| Domain 1 decision record | Confirming backend architecture decisions (modular monolith, entrypoints, API surfaces) beyond the onboarding brief |
| Domain 2 architecture and decisions (UNDER REVIEW) | Module ownership and data boundaries |
| Domain 3 (not approved) | Tenant isolation implementation, RLS policies, provisioning privileges, support access |
| Edge Runtime architecture R1 | Edge transport, stream and sequence identity, event semantics, device credentials, evidence |
| Business rules v3.2 (historical baseline) | Traceability of the superseded rules only |

## Provisional implementation contracts (this repository)

| Contract | Location | Basis |
|---|---|---|
| Event envelope v1 | `contracts/edge-events/v1/envelope.schema.json` | ARC-1 field list; names and types are provisional |
| Edge intake API | `POST /v1/edge/events` | ARC-4, ARC-5 |
| Edge device authentication (development only) | `backend/app/api/v1/edge/device_auth.py` | Placeholder until Domain 3 and the Edge Runtime document |
| Frontend ↔ FastAPI integration proposal | `frontend/FASTAPI-INTEGRATION.md` | Frontend proposal; predates the backend |

## Non-authoritative references

| Source | Use |
|---|---|
| `kingbsm18/RADA_Coffee` (older implementation, different rule set) | **Not** an implementation base (decision D-02). Not consulted for any code in this repository. |
