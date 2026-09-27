# ADR-002: Anonymous students; JWT contributors/admins; invite-token onboarding

**Status:** Accepted · **Date:** 2026-09

## Context
The blueprint's core philosophy: students must never need an account, but
uploads must be controlled. Who can upload, and how do they get access?

## Decision
Three roles:
1. **Student** — anonymous; browse, read, download, rate.
2. **Contributor** — authenticated via JWT (SimpleJWT); exists *only* through
   an invite token: admin generates `InviteToken` (32-byte urlsafe secret,
   7-day expiry, one-time use, revocable), shares the link manually; the
   registration endpoint validates the token, creates the user
   (`role=contributor`) and marks the token used.
3. **Admin** — portal role (`role=admin`) or Django superuser; manages invites,
   resources, stats.

Upload permission = authenticated + active + `is_active_contributor`.

## Alternatives considered
- **Open registration** — fastest growth, worst quality control; rejected
  (blueprint explicitly wants curation).
- **Django session auth for the SPA** — simpler CSRF-wise, but JWT keeps the
  API stateless and mobile-app friendly later; accepted tradeoff: tokens in
  localStorage are XSS-sensitive (mitigated by React's escaping and no
  third-party scripts; revisit if embedding ads/analytics).
- **Email invites** — needs SMTP infrastructure; the manual-share flow matches
  how African campus communities actually coordinate (WhatsApp); deferred.

## Consequences
- No student PII collected at all — nice privacy story.
- Token links leak = one upload account; blast radius contained by one-time
  use + expiry + revocation + admin's `is_active_contributor` kill switch.
