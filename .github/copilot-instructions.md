# Copilot instructions — RADA Coffee R1

## Product and repository

- This is the **only** implementation repository: `kingbsm18/Rada_Coffe_V2.1`.
- Keep the existing application in this repository. Do not create a second backend or implementation repository.
- Preserve the existing Next.js frontend in `frontend/`; backend in `backend/`; Python edge foundation in `edge/`; shared contracts in `contracts/`; project documentation in `docs/`.
- Read `README.md`, `docs/inventory.md`, and `docs/architecture/overview.md` before making architectural or cross-module changes. Then inspect the exact code and tests being changed.
- The current main branch includes merged PR #3: a backend/edge foundation. It is **not** a complete R1 product. Do not rebuild it without evidence of a specific defect.

## Product boundaries

- RADA Coffee compares physical beverage handover observations from the edge with POS transaction lifecycle data.
- A finding is an investigation signal for a café owner; it is **never proof of theft**.
- Edge owns camera-side observations, tracking, physical handover state and local durable event delivery. Edge must not implement POS matching, reconciliation, findings, financial calculations or owner alerts.
- Backend owns POS lifecycle ingestion, reconciliation, matching, financial calculations, findings, offsets, qualification and finalisation.
- Do not invent SKU-level recognition, POS capabilities, camera capabilities, Jetson performance, thresholds, timing values or vendor behaviour.
- No cloud provider, hosting topology, edge transport, CV framework/model, camera access protocol or production deployment technology is selected unless an approved specification explicitly selects it.

## Architecture and decision control

- Domain 1 is closed at direction level.
- Domain 2 decisions D2-1 to D2-13 remain **UNDER REVIEW**. Do not treat them as approved or implement final schema/migrations that depend on them.
- Domain 3 is not approved. Do not claim tenant isolation, PostgreSQL RLS, provisioning or production authentication is complete.
- Domains 6/7 contracts and Domain 14A material discussed in project sessions may contain confirmed, proposed and provisional decisions. Preserve each status; do not silently promote proposals to confirmed rules.
- Treat the R1 Business Rules PDF as the authority for business behaviour when it is explicitly available in the working context. It is intentionally **not committed** because this repository is public. Never copy confidential source documents or secrets into this repository.
- If an authoritative rule or approval is missing, do not guess. Implement only independent technical work, use clearly labelled development fixtures where appropriate, and record the exact blocker.
- Keep immutable source/raw data and derived projections distinct wherever the approved specification requires it. Never mutate historical business facts to make a test pass.

## Engineering workflow

- Work on a focused feature/fix branch. **Never push directly to `main`**. Open a pull request with a concise summary, tests, risks and unresolved questions.
- Before editing, inspect `git status`, current branch and relevant files. Do not overwrite or discard existing user changes.
- Make the smallest cohesive change. Avoid broad refactors, speculative abstractions, unnecessary dependencies and unrelated formatting churn.
- Do not stop after an audit or implementation plan when the task asks for code. Implement, test and report.
- Add or update deterministic tests for behaviour changes. Test failure paths, idempotency and security boundaries where relevant.
- Run only commands that are available in the environment. Never claim a command, test, migration, build or deployment succeeded unless you actually ran it and observed the result.
- In the final report, distinguish **implemented**, **tested**, **not tested**, **provisional**, and **blocked**. Include exact commands and actual outcomes.
- Do not claim production readiness based on unit tests or a simulator.

## Repository-specific checks

Use the commands documented in `README.md`. The main checks include:

- Backend (from `backend/`): `ruff check .`, `ruff format --check .`, `python -m scripts.export_contracts --check`, and `pytest -q`. Backend integration tests require PostgreSQL through `RADA_TEST_DATABASE_URL`; report skipped tests honestly.
- Edge (from `edge/`): `ruff check .`, `ruff format --check .`, and `pytest -q`.
- Frontend (from `frontend/`): `pnpm install --frozen-lockfile`, `pnpm exec tsc --noEmit`, and `pnpm build`.
- For database-dependent work, use the documented Docker Compose/PostgreSQL workflow and run migrations before integration tests.

Do not assume frontend unit tests exist; inspect `package.json` before claiming they were run.

## Security requirements

- Never commit `.env`, credentials, tokens, private keys, signing secrets, customer data or production data.
- Treat credentials and signing secrets previously exposed in remote historical branches as compromised. Never repeat, reuse or copy them. Do not wholesale-merge `v0/frontend-wrapper`.
- Keep development-only device authentication and demo fixtures unavailable in production.
- Prefer fail-closed configuration and authorization. Never weaken authentication, tenant scoping, append-only protections, request limits or validation to make a test pass.
- Do not change event identity/idempotency keys, immutable event tables, quarantine retention, tenant scope or RLS without the applicable approved architecture decision and migration plan.
- Add dependency/security checks only when requested or as part of a clearly scoped security task; do not silently change runtime dependencies.

## Collaboration and handoff

- Other tools/agents may work on separate branches in this same repository. Check current branch and recent commits before duplicating work.
- Do not edit the same files concurrently across branches without coordinating.
- Reference the relevant specification/rule IDs in code comments, tests or PR descriptions where useful.
- When a specification is ambiguous or conflicts with existing code, explain the conflict and propose the narrowest resolution; do not silently choose a new business rule.
