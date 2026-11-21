# Proposed FastAPI integration contract

This document is a frontend proposal, not a claim that a backend exists. The domain models in `types/domain.ts` and DTOs in `types/operations.ts` are provisional and must be reconciled against the delivered FastAPI/OpenAPI schema before connecting production data.

## Configuration and transport

Configure `NEXT_PUBLIC_RADA_API_URL` as the origin or API root (for example `https://api.example.com`), `NEXT_PUBLIC_RADA_API_VERSION` (defaults to `v1`), `NEXT_PUBLIC_RADA_API_TIMEOUT_MS` (defaults to 12000), and `NEXT_PUBLIC_DATA_PROVIDER` as `demo` or `api`. Existing `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_OPERATIONS_API_URL` are temporary URL fallbacks. Never place secrets in `NEXT_PUBLIC_*` variables. Use the `services/http.ts` client for JSON and downloads; it handles query serialization, cancellation, cookies/bearer strategy, timeout, and normalized errors. API mode with no URL is a connection error and must never silently fall back to fixtures.

## Endpoint groups (provisional)

All paths are relative to `/v1` and use JSON unless noted:

- `/auth/{control|business}/login`, `/logout`, `/session`: portal-specific session and identity.
- `/control/workspace`, `/control/customers`, `/control/customers/{id}`, `/control/customers/{id}/provision`: internal customer lifecycle and provisioning.
- `/customers/{customer_id}/establishments`, `/establishments/{id}`, `/users`, `/subscriptions`: tenant locations, memberships and plans.
- `/business/workspace`: authenticated tenant workspace, membership, authorized sites, metrics, cameras and events.
- `/cameras`, `/cameras/{id}/stream`: camera metadata and short-lived authorized stream descriptor.
- `/edge-devices`, `/integrations`, `/cv/detections`, `/pos/transactions`: edge heartbeat, POS/CV health, detections and transactions.
- `/analytics/summary`, `/reconciliation`, `/alerts`, `/reports`, `/audit-logs`: operational reporting and workflows.
- `/health`: dependency health checks.
- `/operations/snapshot`, `/operations/events`: operations snapshot and optional SSE event stream.

Existing screens currently consume the provisional aggregate `/control/workspace` and `/business/workspace` shapes in `services/control-api.ts` and `services/business-api.ts`. These are adapter boundaries, not finalized server contracts.

## Request and response conventions

Use ISO-8601 UTC timestamps and opaque string IDs. List endpoints accept `page` (1-based), `page_size`, `sort`, `order`, and `search`; respond as `{ items, page, pageSize, totalItems, totalPages }`. A successful JSON operation returns its resource or envelope; deletion/logout may return `204 No Content`. For validation return HTTP 422 with `{ detail: [{ loc, msg, type }] }` or `{ code, message, details }`. Other errors should use `{ code, message, details?, request_id? }`; status codes 401, 403, 404 and 5xx have normalized frontend error kinds.

## Authentication and authorization

The default proposed strategy is secure, HttpOnly, Secure, SameSite cookies with separate Control and Business session identities; configure credentialed CORS only for approved frontend origins and include CSRF protections for state-changing cookie-authenticated calls. Bearer support is a centralized strategy option, with refresh callback wiring in the API client; no token is stored in UI components. Authentication and tenant authorization must be enforced by FastAPI on every request. Frontend guards and permission checks are presentation behavior only and are not security boundaries.

Control identities must have internal RADA roles. Business identities are scoped to a customer and an explicit establishment set. Every business query, mutation, export, and stream-resolution operation must derive tenant scope from the authenticated session and intersect requested establishment IDs with the caller's grants; never trust a client-supplied tenant ID as authorization. Provisioning must create the customer, locations, initial owner membership, roles, and subscription as an atomic or recoverable operation and return a clear result for partial integration setup.

## Cameras and real time

Never return RTSP credentials to browsers. The API may issue an expiring WebRTC/HLS playback descriptor from `/cameras/{id}/stream`, after checking user and site authorization; the frontend camera adapter resolves it and owns stream lifecycle/error states. Confirm the actual media protocol and token-refresh requirements before enabling streams. Realtime may use SSE (`text/event-stream`) for `/operations/events`, WebSocket, or another backend-supported transport. Events should include stable IDs, event types, UTC occurrence times, and typed payloads; reconnects must support replay or tolerate duplicate IDs. Do not mark simulated placeholders as live feeds.

## Analytics, reconciliation, and monitoring

Analytics responses should identify the tenant/site scope and aggregation period, include units/currency, and expose denominator/numerator definitions for rates. Reconciliation records should reference their handover and POS transaction when available and use stable status enums; mutations need idempotency where retries can duplicate decisions. Alerts expose severity, lifecycle state and timestamps. Health endpoints should avoid sensitive configuration and report dependency status, timestamps, and optional latency. Audit entries should be append-only and include actor, action, resource, timestamp, and safe metadata; authorization and retention remain server responsibilities.

## Contract validation before cutover

1. Compare the shipped OpenAPI schema with `types/domain.ts`, `types/operations.ts`, and service adapter DTOs.
2. Map backend naming/envelopes once in API adapters, not in React components.
3. Verify tenant isolation and role enforcement server-side, including exports and camera stream resolution.
4. Exercise loading, empty, validation, expired-session, forbidden, unavailable, timeout, and cancellation states against a staging API.
5. Enable the `api` provider only after these checks; the demo adapter remains deterministic and explicitly illustrative.
