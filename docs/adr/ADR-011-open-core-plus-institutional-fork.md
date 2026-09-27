# ADR-011: Two editions — open core (public) + private institutional fork

**Status:** Accepted · **Date:** 2026-09

## Context
The owner is open-sourcing StudyShelf to build an engineering portfolio, while
keeping the door open for the university that inspired it. If that institution
deploys it, the deployment must not be constrained by (or leak through) the
public codebase — and hardened/custom security logic must not be public.

## Decision
The public repository is the **open core**: generic branding ("StudyShelf"),
no secrets, no institution-specific configuration. Any institutional
deployment is a **private fork** that may contain: real branding, changed or
hardened security logic (rate limits, auth flows, audit logging), private
storage credentials, and deployment specifics.

## Rules that keep the fork cheap (enforced from day one)
1. **No secrets in the public repo, ever.** Configuration via environment
   variables (`SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, …);
   `.env` is gitignored; `.env.example` documents the shape.
2. **No institution names/paths hardcoded in code.** Faculties/departments are
   *data*, seeded via a management command — exactly what an institution
   fork would customize.
3. **All environment differences flow through settings/env** (DEBUG, hosts,
   storage, database) — see ARCHITECTURE.md §6.

## Alternatives considered
- **One repo with "institution mode" feature flags** — couples the public
  product to private concerns and invites secrets leakage through config
  drift; rejected.
- **Never open-source** — loses the portfolio/reputation value that is an
  explicit goal; rejected.

## Consequences
- Forking for an institution is a `git clone -b institutional` plus data
  seeding plus secrets injection — hours, not weeks.
- Public code stays honest: every deviation between the public product and
  the deployed product is a visible, reviewable fork commit.
