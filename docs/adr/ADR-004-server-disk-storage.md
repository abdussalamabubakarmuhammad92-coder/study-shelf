# ADR-004: File storage on server disk (object storage deferred)

**Status:** Accepted · **Date:** 2026-09

## Context
Resources are PDFs/PPTX/images up to 50 MB. Where do they live? The blueprint
suggested Cloudinary; the owner decided production runs on a single VPS with
files on server disk.

## Decision
`FileField(upload_to='resources/%Y/%m/')` on local storage (`MEDIA_ROOT`).
Docker production mounts a named volume `media_data` over `/app/media`.

## Alternatives considered
- **Cloudinary/S3** — CDN bandwidth, survives server loss, but: external
  account dependency, credentials management, cost beyond free tier, and
  downloads no longer flow through the app (breaking exact download
  counting or requiring signed-redirect plumbing). Deferred; the switch is
  cheap later because all access goes through `Resource.file`.
- **Database BLOBs** — kills DB performance for large files; rejected outright.

## Consequences
- Backups must cover `media/` alongside the DB (documented in ADMIN_GUIDE).
- Multi-server horizontal scaling would need shared storage — fine: v1 is
  explicitly single-server.
- Download counting works precisely because files stream through Django
  (`FileResponse`); if we move to CDN redirects later, counting moves to a
  signed-URL issuance endpoint.
