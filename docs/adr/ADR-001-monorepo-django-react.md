# ADR-001: Monorepo — Django/DRF backend + React/TypeScript SPA frontend

**Status:** Accepted · **Date:** 2026-09

## Context
We needed a full-stack portal with an admin panel, a REST API, file handling,
and a modern UI, built by a small team (one developer + AI assistance) and
later open-sourced as a portfolio piece.

## Decision
One repository with two apps: a Django 5.x backend (DRF for the API, Django
admin for governance) and a React 18 + TypeScript + Vite + Tailwind frontend.
The built SPA is copied into `backend/static` and served by Django itself.

## Alternatives considered
- **Two repos / separate hosts** — cleaner separation, but CORS, versioning and
  deployment overhead for a solo project; rejected.
- **Django templates only (no SPA)** — simpler, but the sidebar/grid/reader UX
  and dark-mode theming wanted a component model; rejected for v1 goals.
- **Next.js full-stack** — excellent DX, but Django admin is a huge win for the
  admin/curator workflow and Python fits the file/ORM needs; rejected.

## Consequences
- One deployable unit; no CORS in production; single `docker compose up`.
- Requires a build step (`npm run build:unified`) before serving.
- TypeScript strictness buys refactor safety for a project expected to evolve.
- Tailwind chosen over shadcn/ui component library to keep dependencies few and
  the visual language fully owned; component primitives are small and local.
