# RADA Coffee R1

RADA Coffee compares beverage handovers observed at the edge with POS transaction lifecycles, and produces findings for a café owner to investigate. A finding is an investigation signal, never proof of theft.

**Current state:**
- The frontend shell exists.
- The backend foundation and a provisional edge-event intake exist.
- The edge local event log exists.
- Matching, findings and financial logic are **not implemented yet**.

See [docs/README.md](docs/README.md).

| Path | What it is |
|---|---|
| `frontend/` | Next.js 16 portals (Control and Business) |
| `backend/` | FastAPI and PostgreSQL modular monolith (API and worker) |
| `edge/` | Edge runtime foundation (crash-safe event log) |
| `contracts/` | Shared contracts (provisional event envelope v1) |
| `docs/` | Inventory, decisions, architecture, security |
| `infrastructure/` | Infrastructure notes |

## Prerequisites

- Docker with Compose v2.
- Python 3.12, for running the backend or edge outside Docker.
- Node.js ≥ 20.9 and pnpm 12.3.4. Run `corepack enable` and pnpm is picked up from `frontend/package.json`.

## Run the backend stack (Docker)

```bash
cp .env.example .env             # local values only; .env is git-ignored
docker compose up -d --build --wait db api worker
curl http://localhost:8000/health
curl http://localhost:8000/health/ready   # 200 once the database is reachable and migrated
docker compose logs -f api worker
docker compose down                # add -v to delete the database volume
```

`migrate` runs `alembic upgrade head` before `api` and `worker` start. If port 5432 is already in use, set `POSTGRES_PORT`.

## Send a test edge event (development only)

Edge device authentication is a development-only placeholder. Outside `development` and `test`, every edge request is refused. To register a local device:

```bash
KEY=choose-a-local-key
SHA=$(printf %s "$KEY" | sha256sum | cut -d' ' -f1)
export RADA_EDGE_DEV_DEVICES="[{\"key_sha256\":\"$SHA\",\"tenant_id\":\"11111111-1111-4111-8111-111111111111\",\"establishment_id\":\"22222222-2222-4222-8222-222222222222\",\"source_instance\":\"edge-demo-01\"}]"
docker compose up -d --wait api
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
curl -X POST http://localhost:8000/v1/edge/events \
  -H "X-RADA-Device-Key: $KEY" -H 'Content-Type: application/json' \
  -d "{\"events\":[{\"event_id\":\"demo-1\",\"tenant_id\":\"11111111-1111-4111-8111-111111111111\",\"establishment_id\":\"22222222-2222-4222-8222-222222222222\",\"source_instance\":\"edge-demo-01\",\"sequence\":1,\"event_type\":\"observation\",\"schema_version\":\"1\",\"source_time\":\"$NOW\",\"edge_recorded_at\":\"$NOW\",\"config_version\":\"cfg-1\",\"model_version\":\"model-1\",\"payload\":{}}]}"
```

Sending the same request again returns `duplicate`. See [contracts/README.md](contracts/README.md).

## Backend without Docker

```bash
docker compose up -d --wait db
cd backend
python3.12 -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload          # API on :8000, docs at /docs in development
python -m app.workers.main             # worker (or --once)
```

Settings use the `RADA_` prefix and are read from the environment, `backend/.env` or the root `.env`. See `backend/app/core/config.py`.

## Tests and checks

```bash
# backend (integration tests need PostgreSQL; they create and drop their own database)
cd backend
ruff check . && ruff format --check .
python -m scripts.export_contracts --check
RADA_TEST_DATABASE_URL=postgresql+psycopg://rada:rada_dev_password@localhost:5432/rada pytest -q

# edge
cd edge && python3.12 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"
ruff check . && pytest -q

# frontend
cd frontend && pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm build
```

Without `RADA_TEST_DATABASE_URL`, backend integration tests are skipped. In CI they always run against a PostgreSQL service (`.github/workflows/ci.yml`).

## Frontend

```bash
cd frontend
cp .env.example .env.local
pnpm dev                              # http://localhost:3000
```

There are two data modes:
- **`NEXT_PUBLIC_DATA_PROVIDER=demo`:** explicit fixture mode for development. The UI shows a DEVELOPMENT badge and "Demo data".
- **`NEXT_PUBLIC_DATA_PROVIDER=api`:** no fixtures. The Control top bar shows the live result of the backend's `/health/ready`. Portal data endpoints do not exist in the backend yet, so pages show a connection notice instead of data.

## Rules for contributors

- Work on a branch and open a PR. Never push to `main`.
- Never commit `.env` files, credentials or keys.
- Business behaviour must trace to the R1 Business Rules Specification. Do not invent rules. Mark provisional contracts as PROVISIONAL.
