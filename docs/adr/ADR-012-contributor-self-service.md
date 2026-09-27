# ADR-012: Contributor self-service — edit and delete own uploads

**Status:** Accepted · **Date:** 2026-09

## Context
Phase 1 reduced a contributor to "someone who can upload": after uploading they
could not see their materials, fix a typo, remove an outdated file, or observe
the downloads/upvotes their work earned. That feedback loop is the entire
motivation for contributing, and its absence showed in testing.

## Decision
Contributors get a dashboard (`/dashboard`) fed by `GET /api/me/uploads/`,
showing personal aggregates (uploads, downloads earned, upvotes earned) and
their resource list. On their OWN resources they may:
- **PATCH** metadata — restricted to `title`, `description`, `course_code`
  (never the file or department);
- **DELETE** — removing both the database row and the stored file, with a
  confirmation step in the UI.

Enforcement is a new object-level permission, `IsOwnerOrAdmin`; admins retain
full rights through the same endpoint. Admins also gain a Contributors tab
(roster with earned stats, deactivate/reactivate kill switch, reset-link
generation).

## Alternatives considered
- **Edit-only, admin-only delete** — protects students from losing popular
  materials, but makes contributors helpless against their own mistakes and
  multiplies admin toil. The invite gate already limits who can upload; that
  plus the deactivation switch is the right containment.
- **Status quo** — cheapest, but leaves the contributor experience hollow.

## Consequences
- Ownership is enforced server-side (tests cover owner/other-contributor/
  admin/anonymous matrix) — the UI is not the gate.
- Deletes remove files from disk (no orphans) — the same fix was applied to
  the admin delete path, which previously orphaned files.
- C5 from DECISIONS-FOR-REVIEW is resolved by the rename feature rather than
  a title field at upload time.
