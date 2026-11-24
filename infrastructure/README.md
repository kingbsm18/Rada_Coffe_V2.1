# Infrastructure

- **Local development:** `docker-compose.yml` at the repository root. It runs PostgreSQL 16, a one-shot `migrate` service, `api` and `worker`.
- **Staging and production:** not defined. No hosting provider is approved (spec Chapter 23), so no provider-specific files exist.
- **Backups:** not configured. ARC-11 requires a tested restore before a backup counts as reliable.
