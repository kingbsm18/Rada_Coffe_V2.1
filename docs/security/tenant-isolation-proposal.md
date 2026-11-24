# Tenant isolation: proposal and test plan

**Status: PROPOSED. Domain 3 is not approved. Nothing in this document is implemented.**

The confirmed requirement is ISO-2 (shared PostgreSQL with RLS, seven safeguards). This proposal shows one way to meet it, for review.

## Proposal

1. **Database roles:**
   - `rada_migrator` owns the schema.
   - `rada_app` is tenant-scoped, has no `BYPASSRLS`, and is not a table owner.
   - `rada_platform` handles platform operations. It is audited and its use is explicit.
2. **Tenant-owned rows:** every tenant-owned table carries `tenant_id`. Establishment-scoped tables also carry `establishment_id`, with a composite foreign key `(tenant_id, establishment_id)` so that cross-tenant establishment references are impossible.
3. **RLS policies:** use `current_setting('rada.tenant_id', true)` and `rada.establishment_ids`. Set them with `SET LOCAL` inside each transaction, so the context cannot leak through connection pooling (safeguard 4).
4. **Where tenant identity comes from:** the API layer derives it from the verified session or device credential only, never from request data (safeguard 1). Background jobs set the same context per unit of work (safeguard 3).
5. **Edge credentials:** each credential maps to exactly one tenant, establishment and device (safeguard 5). The current intake already rejects envelopes outside the device scope, but its credential store is development-only.

## Test plan (to run once Domain 3 is approved)

| Test | Spec scenario |
|---|---|
| A tenant A session cannot read tenant B rows through any API, with RLS as the second barrier | MT9, PM5 |
| Queries without `rada.tenant_id` return no rows for `rada_app` | ISO-2 (3) |
| Pooled connections do not carry tenant context between requests | ISO-2 (4) |
| Cross-tenant establishment references are rejected by constraints | ISO-2 (7) |
| Edge credential for establishment X cannot write events for Y | ISO-2 (5) (an intake-level check exists today) |
| Exports, evidence URLs and jobs enforce the same scope | ISO-2 (6) |

## What exists today

- Intake checks that each event matches the authenticated device scope. A mismatched event is quarantined with reason `device_scope_mismatch`.
- Raw event tables are append-only.
- **There are no RLS policies, no tenant tables and no user authentication yet.**
