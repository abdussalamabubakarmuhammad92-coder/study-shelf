# ADR-008: Uploads are auto-approved; curation via featured/hidden flags

**Status:** Accepted (flagged for revisit) · **Date:** 2026-09

## Context
Should contributor uploads appear instantly, or wait for admin approval?
Blueprint default: auto-approve, revisit later.

## Decision
`is_approved=True` by default — uploads are public immediately. The admin
dashboard offers management: search, delete (removes file + row), feature
(`is_featured` pins to home page), and un-approve (hides without deleting)
via Django admin.

## Alternatives considered
- **Moderation queue** — best quality control, worst contributor motivation
  ("I uploaded 2 days ago, where is it?"), and it makes the admin a bottleneck.
  Revisit *only if* abuse appears; the invite system already gates who can
  upload at all.

## Consequences
- Contributors get instant feedback (upload → live in seconds), which matters
  for community goodwill.
- Risk is contained upstream: only invite-holders can upload, and admins can
  revoke upload ability per user (`is_active_contributor`).
- Public listing filters `is_approved=True`; admins see everything via the
  admin resource ViewSet.
