# ADR-005: SQLite for development, PostgreSQL for production

**Status:** Accepted · **Date:** 2026-09

## Context
The blueprint mandates PostgreSQL, but development machines (Windows, no
Docker daemon running) shouldn't need a database server to hack on the project.

## Decision
`DATABASE_URL`-driven configuration: defaults to SQLite in dev;
`docker-compose.yml` exports a Postgres URL for production. All code uses the
ORM only (no raw SQL, no SQLite-specific fields), so the engine is swappable.

## Alternatives considered
- **Postgres everywhere (Docker required for dev)** — matches prod exactly,
  but raises the contribution barrier (need Docker to run tests); rejected
  for an open-source project where easy onboarding matters.
- **SQLite in production** — actually viable at this scale (read-heavy,
  single writer), but upload-driven writes + future full-text search favor
  Postgres; also Docker makes Postgres free operationally. Chosen for prod.

## Consequences
- Migrations are engine-agnostic; CI can test on SQLite while prod runs
  Postgres.
- Full-text search currently uses `icontains` (works on both engines);
  Postgres-specific search (tsvector) is a future upgrade that would make
  SQLite dev slightly less representative — acceptable.
