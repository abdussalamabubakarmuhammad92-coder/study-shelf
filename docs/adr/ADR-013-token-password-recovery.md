# ADR-013: Password recovery via shareable admin-generated tokens (no email)

**Status:** Accepted · **Date:** 2026-09

## Context
Phase 1 had no password recovery at all: a contributor who forgot their
password was locked out until an admin edited the database. The portal has no
email infrastructure, and adding SMTP (server, credentials, deliverability)
conflicts with the minimal-infrastructure decision (ADR-007).

## Decision
Reuse the proven invite-token pattern:
- Admin clicks "Reset password" on a contributor → backend generates a
  one-time `PasswordResetToken` (32-byte urlsafe secret, 24-hour expiry) and
  voids any previous unused token for that user;
- Admin sends the link `{origin}/reset/{token}` manually (WhatsApp, SMS…);
- The holder opens the link, which validates the token publicly and sets a
  new password (min 8 chars); the token is burned on use.

## Alternatives considered
- **Email-based reset** — the classic flow; rejected until the project has
  real SMTP operations (deliverability is a maintenance surface, not a
  feature).
- **Admin sets a temporary password** — simplest, but passwords travel in
  plaintext through chat and admins learn credentials they shouldn't know.
- **Security questions** — weak by modern standards; rejected.

## Consequences
- Day-one password recovery with zero infrastructure; architecturally
  symmetric with invites (one mental model: admin-generated shareable
  secrets).
- Like invites, a leaked link is contained: single-use, 24h expiry,
  superseded by newer generation.
- If email arrives later, this flow can keep running as the fallback; the
  token model is reusable for email links.
