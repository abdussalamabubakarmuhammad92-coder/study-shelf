# ADR-007: No background workers, no cache, no websockets in v1

**Status:** Accepted · **Date:** 2026-09

## Context
The blueprint listed Redis and Celery/Django-Q "for file processing and
thumbnails". Infrastructure you don't need is pure operational debt.

## Decision
Ship v1 synchronous and workerless: uploads are validated and saved inline;
no thumbnail generation (the UI uses file-type badges, not image previews);
no email sending (invites are shared manually by design); no cache layer
(the dataset is small and queries are selective enough).

## Alternatives considered
- **Celery + Redis for thumbnails/antivirus** — right call at scale; wrong at
  zero-users. Every added process is another thing to deploy, monitor, and
  explain to contributors running this on campus servers.

## Consequences
- `docker compose up` runs exactly two containers (web + db). Redis appears
  only when a real need (rate limiting, async processing, full-text search
  caching) lands — see ROADMAP in DECISIONS-FOR-REVIEW.md.
- Upload request duration is bound by file transfer + disk write (fast at
  50 MB ceiling on campus LAN).
