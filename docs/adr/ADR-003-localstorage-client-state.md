# ADR-003: Client-persistent state in localStorage (ratings, recent downloads, theme)

**Status:** Accepted (flagged for revisit) · **Date:** 2026-09

## Context
Two features need "remember this browser" behavior without asking students to
log in: rating anti-spam (one upvote per resource per browser) and "your
recent downloads" (last 3). There is no identity to key a server-side record
on — unless we set cookies/fingerprints.

## Decision
Use `localStorage` keys: `rated_resources` (array of ids), `recent_downloads`
(capped at 3), `dark_mode`. Hooks encapsulate reads/writes. The server
additionally keeps per-resource aggregates (rating_count/sum, download_count).

## Alternatives considered
- **Cookie + server-side rating rows** — stronger anti-spam, but: cookie
  consent banners, privacy surface, and a database row per anonymous rating
  (unbounded growth). Rejected for v1.
- **IP-based throttling** — breaks on campus NAT where hundreds share one
  public IP; would block legitimate classmates. Rejected.
- **Fingerprinting** — creepy; conflicts with the privacy story. Rejected.

## Consequences
- **Honest limit:** clearing localStorage (or a curl script) bypasses rating
  anti-spam. Accepted because ratings are low-stakes aggregates; a server-side
  rate limit (per-IP+per-resource with generous campus-NAT windows) is the
  designed future fix.
- Recent downloads are device-local — arguably the correct semantics anyway.
- Zero personal data collected.
