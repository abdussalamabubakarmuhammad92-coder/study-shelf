# ADR-010: No pagination on resource lists in v1 (flagged for revisit)

**Status:** Accepted — flagged · **Date:** 2026-09

## Context
DRF ships pagination in a few lines; the frontend would need paging or
infinite-scroll UI. Current data: 9 faculties, 42 departments, tens of
resources per department at most.

## Decision
Ship unpaginated list endpoints (`/api/resources/`, `/api/faculties/`) and
filter server-side (faculty/department/search). Revisit when any department
approaches ~500 resources or response payloads exceed a few hundred KB.

## Alternatives considered
- **Page-number pagination now** — cheap to add later (settings change +
  frontend wiring), and adding it *before* it's needed would churn the UI for
  no user-visible benefit. Also: faculty/department browsing pages are
  naturally small; only global search results grow unboundedly.

## Consequences
- Frontend renders full result sets; a huge result set would jank the grid.
- The `/api/faculties/` payload embeds departments (42 rows) — fine; if
  faculties grow, this endpoint gains query params or splitting.
- **This ADR exists so the revisit trigger is written down**, not vibes.
