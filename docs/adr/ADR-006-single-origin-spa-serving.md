# ADR-006: Single-origin serving — Django serves the SPA, API, media and admin

**Status:** Accepted · **Date:** 2026-09

## Context
The SPA needed to be delivered somehow in production. Options: separate
static host/CDN, Node server, or Django itself.

## Decision
Vite builds with `base: '/static/'`; `npm run build:unified` copies `dist/`
into `backend/static`; Django serves it (WhiteNoise with compressed
manifest storage for prod), serves `/media/` files, the API and the admin —
all on one origin. A regex catch-all route (`^.*$`, placed last) renders the
SPA index for client-side deep links like `/resource/5` or `/browse/...`.

## Alternatives considered
- **CDN for the SPA** — optimal at scale; unnecessary complexity for one
  university's traffic. Deferred.
- **Nginx serving static directly** — the classic prod pattern; kept as a
  future optimization, but WhiteNoise achieves "correct and fast enough" with
  zero extra moving parts, which matters for one-command Docker deploys.

## War story (why the `base` matters)
The first build used Vite's default `/assets/` paths; Django's SPA catch-all
then swallowed those requests and returned *HTML* to `<script src>` tags —
a fully blank page. Root-caused by fetching the bundle and observing
`text/html` as content-type. Fixed by `base: '/static/'` + regex catch-all
(`re_path`) instead of `path('')` so deep links like `/resource/100` also
reach the SPA.

## Consequences
- Deep links, hard refreshes, and shareable URLs all work.
- Django (not a proxy) streams file downloads — precise download counters.
- One TLS certificate, one CORS policy (none needed in prod).
