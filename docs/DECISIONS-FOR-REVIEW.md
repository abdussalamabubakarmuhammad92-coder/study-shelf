# StudyShelf — Decisions & Features for Your Review

> **How to use this file:** read each row, decide **keep** or **change**, and
> write your verdict on the blank line. Bring this back (marked up or just
> conversationally) and the next build phase is planned from your verdicts.
> ⚠️ = explicitly flagged as worth reconsidering. Items without ⚠️ still belong
> to you — nothing is locked.

---

## A. Product & scope decisions

| #  | Decision                                                                    | Status | Your verdict |
|----|-----------------------------------------------------------------------------|--------|--------------|
| A1 | Students are fully anonymous — no accounts, no personal data                | ✅ decided | __________ |
| A2 | Contributors exist only through admin invite links (one-time, 7-day expiry, revocable) | ✅ decided | __________ |
| A3 | Uploads are auto-approved and public immediately (no moderation queue)      | ⚠️ revisit if abuse appears | __________ |
| A4 | Students can upvote resources; anti-spam is one vote per browser (localStorage) | ⚠️ bypassable by clearing storage — server-side limiting is the future fix | __________ |
| A5 | Reading a PDF in-browser does NOT increment the download counter; only downloads do | ✅ decided (intentional) | __________ |
| A6 | "Recent downloads" shows your last 3 downloads, stored on your device only  | ✅ decided | __________ |
| A7 | Search covers title, course code, filename, description (substring match, not full-text) | ⚠️ Postgres full-text search is the upgrade path | __________ |
| A8 | 50 MB per-file limit; PDF, DOCX, PPTX, TXT, JPEG/PNG/GIF/WEBP allowed       | ✅ decided | __________ |
| A9 | Uploads validated by size + extension-derived type, NOT content sniffing    | ⚠️ a mislabeled file is stored as "other" rather than blocked | __________ |
| A10| Clean launch: production starts with faculties + departments only, no demo resources/accounts | ✅ your decision | __________ |
| A11| Two editions: this public open-source repo + a private hardened fork for any institution | ✅ your decision | __________ |

## B. Architecture decisions (each has a full ADR in `docs/adr/`)

| #  | Decision                                                    | ADR      | Status | Your verdict |
|----|-------------------------------------------------------------|----------|--------|--------------|
| B1 | Monorepo: Django+DRF backend, React+TS+Tailwind SPA, served by Django | ADR-001 | ✅ | __________ |
| B2 | JWT auth (SimpleJWT), tokens in localStorage, silent refresh | ADR-002 | ✅ (XSS tradeoff documented) | __________ |
| B3 | localStorage for ratings/recent downloads/theme — no anonymous cookies or fingerprints | ADR-003 | ✅ flagged | __________ |
| B4 | Files on server disk (VPS volume); Cloudinary/S3 deliberately deferred | ADR-004 | ✅ your decision | __________ |
| B5 | SQLite in dev, PostgreSQL in production (docker-compose)     | ADR-005 | ✅ | __________ |
| B6 | Single origin: Django serves SPA + API + media + admin; no CORS | ADR-006 | ✅ | __________ |
| B7 | No Celery/Redis/background workers in v1                     | ADR-007 | ✅ | __________ |
| B8 | In-browser PDF via native browser viewer; pdf.js is the upgrade path | ADR-009 | ⚠️ flagged | __________ |
| B9 | No pagination on resource lists yet                          | ADR-010 | ⚠️ revisit at ~500 resources/department | __________ |
| B10| Rating aggregates stored as rating_sum/rating_count (upvote-only model, no 5-star scale) | ✅ decided | __________ |

## C. Data & content decisions

| #  | Decision                                                                 | Status | Your verdict |
|----|--------------------------------------------------------------------------|--------|--------------|
| C1 | Faculties/departments are seed *data* (editable in Django admin anytime) | ✅ decided | __________ |
| C2 | Current taxonomy: 9 faculties, 42 departments (your real list)           | ✅ verified | __________ |
| C3 | New faculties/departments added via Django admin (proven with a live add+delete test) | ✅ verified | __________ |
| C4 | Course code is optional, uppercase-normalized, free-text (e.g. CSC301)   | ✅ decided | __________ |
| C5 | Resource titles auto-derived from filename on upload; **resolved Phase 2** — contributors rename via their dashboard edit | ✅ resolved | __________ |
| C6 | In-browser reading is PDF-only; DOCX/PPTX download-only. **Phase 2 took the cheap win:** images render inline on the resource page. Remaining options for DOCX unchanged: (a) keep as-is, (b) docx-preview client-side, (c) server-side LibreOffice conversion, (d) third-party viewers (rejected: privacy). | ⚠️ partially resolved | __________ |

## D. Known gaps — honest list (not decisions, just reality)

| #  | Gap                                                              | Planned? |
|----|------------------------------------------------------------------|----------|
| D1 | No automated tests yet (backend or frontend) | **RESOLVED Phase 2** — 38-test backend suite (`apps/api/tests.py`) + GitHub Actions CI |
| D2 | No CI/CD pipeline | **RESOLVED Phase 2** — `.github/workflows/ci.yml` (backend tests + frontend build) |
| D3 | No rate limiting on public endpoints (downloads, ratings) | Production hardening — still open |
| D4 | No HTTPS/production server config (Nginx/Caddy) | Deployment phase — still open |
| D5 | Admin dashboard cannot yet restore/rename resources (only delete); richer editing lives in Django admin | Partially improved Phase 2: admin delete now removes files; contributors edit own metadata |
| D6 | Demo accounts (`admin/admin123`, `contributor/contributor123`) and a demo invite exist in the dev database | Removed at clean launch |
| D7 | Cosmetic: on narrow phones the file-info row cramps | **RESOLVED Phase 2** — file block stacks vertically under 640px, verified at 390px |

## E. Roadmap candidates (nothing committed — pick what you want)

1. **Backend test suite + CI** (pytest, GitHub Actions) — the strongest
   portfolio signal per hour spent.
2. **Server-side rating rate-limit** — closes A4's honest gap.
3. **Pagination** — when data grows (B9).
4. **Full-text search** (Postgres tsvector) — better than substring for
   "operating systems" vs "OS".
5. **Contribution leaderboards** — top contributors on the home page.
6. **Collections/playlists** — a contributor curates "CSC201 semester pack".
7. **Email invites** (optional SMTP config) — parallel to manual sharing.
8. **Dark/light PDF reader theme** via pdf.js upgrade path.
