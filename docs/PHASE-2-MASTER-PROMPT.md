# PHASE 2 MASTER PROMPT — Contributor System v2 + Production Push Prep

> **Purpose of this document:** it is the single source of truth for the next
> implementation sprint. Every change must trace to a workstream here. Anything
> not written here is out of scope, no matter how good the idea feels mid-sprint.
> Decisions already made by the owner are marked 🔒 and are not re-litigable.

---

## 0. Mission

Finish StudyShelf as a complete product: give contributors a real lifecycle
(dashboard, ownership, stats, password recovery), give admins full control from
the SPA, harden for production, and prepare the repository for public push —
**without** adding any feature not listed below.

## 1. Locked decisions 🔒

| # | Decision |
|---|----------|
| D1 | Contributors may **edit and delete their own** uploads (edit: title/description/course code; delete: file + row, with confirmation). Admins retain full rights. |
| D2 | Password reset = **shareable one-time tokens** (admin generates a 24h link, sends it manually). No SMTP anywhere. |
| D3 | Push preparation = **local git with clean history + tests + CI config + production settings**. The owner performs the actual GitHub publish by hand. |
| D4 | Storage stays on server disk; database stays SQLite-dev/Postgres-prod. |
| D5 | Images render inline on the resource page (the only C6 concession). DOCX/PPTX remain download-only. |
| D6 | C5 is resolved by the dashboard's rename feature — no title field at upload time. |
| D7 | The mobile file-info cramping fix is in scope. |

## 2. Explicitly OUT of scope (do not build, do not "quickly add")

DOCX/PPTX rendering · pagination · full-text search · email of any kind ·
rate-limiting middleware · contributor leaderboards · collections · comments ·
multi-server concerns · any UI framework migration.

---

## 3. Workstreams

### WS1 — Backend: password reset tokens
- New model in `apps/invites` (same domain of "shareable secrets"):
  `PasswordResetToken(token urlsafe32 unique, user FK, created_by FK,
  expires_at (24h), is_used, used_at)` + `generate()`, `is_valid()`, `use()`.
- Endpoints:
  - `POST /api/admin/users/<id>/reset-password/` (admin) → `{token}`; admin
    builds the link `{origin}/reset/{token}`.
  - `GET /api/auth/password-reset/validate/?token=` (public) → `{valid}`.
  - `POST /api/auth/password-reset/confirm/` (public) `{token, password}`
    (min 8 chars) → sets password, marks token used, returns 200.
- One active unused token per user is enough; generating a new one may
  invalidate prior unused ones (simplest safe behavior).
- **AC:** full lifecycle test — generate → validate → confirm → login with new
  password; expired/used/reused tokens all rejected.

### WS2 — Backend: contributor self-service
- `GET /api/me/uploads/` (contributor) → own resources with stats
  (reuse `ResourceListSerializer`).
- `PATCH /api/resources/<id>/` — allowed for **owner or admin**; mutable
  fields: `title`, `description`, `course_code` only (never file/department).
- `DELETE /api/resources/<id>/` — owner or admin; deletes the stored file,
  then the row.
- New permission class `IsOwnerOrAdmin` (object-level check on
  `uploaded_by == request.user` or portal admin).
- **AC:** contributor A cannot PATCH/DELETE contributor B's resource (403/404);
  owner can; admin can; file disappears from `media/` on delete.

### WS3 — Backend: admin contributors management
- `GET /api/admin/contributors/` (admin) → list of contributor users with
  `upload_count`, `downloads_earned`, `upvotes_earned`, `date_joined`,
  `is_active_contributor`.
- `PATCH /api/admin/contributors/<id>/` (admin) → toggle
  `is_active_contributor`. Deactivated contributors: existing tokens keep
  working for reads but uploads are already blocked by
  `IsAuthenticatedContributor` — verify that path.
- **AC:** stats numbers correct against fixture data; deactivated user gets
  403 on upload and the SPA shows a clear message.

### WS4 — Backend: invite revoke from SPA
- `POST /api/invites/<id>/revoke/` (admin) → sets `is_revoked=True` on unused
  invites; 400 on already-used.
- **AC:** revoked invite fails validation and registration.

### WS5 — Backend: registration department picker
- `POST /api/auth/register/` accepts optional `department` (id); validated to
  exist; stored on `User.department`.
- **AC:** register with and without department; bogus id → 400.

### WS6 — Frontend: Contributor Dashboard (`/dashboard`)
- Route for contributors (admins keep `/admin`). Header button for
  contributors becomes **Dashboard**; upload form remains at `/upload`,
  linked from the dashboard.
- Components: stats strip (uploads / downloads earned / upvotes earned);
  "My uploads" table (title, department, date, ⬇ count, ★ count, status);
  row actions **Edit** (inline modal: title, course code, description) and
  **Delete** (confirm dialog, then refresh list); **Upload new** button.
- Uses `GET /api/me/uploads/`, `PATCH`, `DELETE` from WS2.
- **AC:** edit persists and is visible on the public resource page; delete
  removes card from public browse; stats match the table.

### WS7 — Frontend: admin contributors tab + invite revoke
- Admin dashboard gains a **Contributors** tab (Stats | Invites | Contributors
  | Resources): table from WS3, with Deactivate/Reactivate button and
  "Reset password" → modal showing the generated `/reset/{token}` link with
  copy button (same UX as invites).
- Invites tab: **Revoke** button on unused invites (WS4), with confirm.
- **AC:** full admin flow operable without touching `/admin/`.

### WS7b — Frontend: admin resources filtered by faculty/department (owner request, 2026-09-27)
- Resources tab gains two cascading dropdowns above the list: **Faculty**
  ("All faculties" default) and **Department** (disabled until a faculty is
  chosen; "All departments" default), driving the existing backend
  `?faculty=` param; backend admin viewset additionally gains a `department`
  slug filter param (WS2-adjacent, one-line queryset addition).
- Filters combine with the existing search box and persist across tab
  switches within a session (component state is enough).
- **AC:** selecting a faculty narrows the list; selecting a department narrows
  further; search composes with filters; clearing filters restores the full
  list; incorrect slugs yield an empty list rather than an error.

### WS8 — Frontend: reset page + wiring
- New route `/reset/:token` (`pages/PasswordReset.tsx`): validates token
  (WS1), shows new-password form (min 8), success → link to login.
- Login page gains a short note: "Forgot password? Contact your portal admin."
- **AC:** full user journey in browser: admin generates → contributor opens
  link on another device/profile → sets password → logs in.

### WS9 — Frontend: small fixes
- **D7 mobile fix:** file-info block on resource page stacks vertically under
  640 px (filename full-width, meta line unwrapped, buttons full-width row).
- **D5 images inline:** `file_type === 'image'` renders the file in an
  `<img>` (rounded card, same slot as the PDF reader).
- **D6 rename** ships as part of WS6 (no separate work).
- **AC:** 390 px screenshot review of resource page: no truncated filename,
  no 3-line meta wrap; image resource displays inline.

### WS10 — Production readiness (code)
- Settings: when `DEBUG=False`, refuse the default `SECRET_KEY`
  (raise ImproperlyConfigured); `ALLOWED_HOSTS` env-driven (already); media
  must serve when `DEBUG=False` (single-server v1) — move the media serve
  route out of the DEBUG-only block.
- `.env.example` committed (SECRET_KEY, DEBUG, ALLOWED_HOSTS, DATABASE_URL);
  real `.env` stays gitignored.
- `seed_data --production`: seeds **faculties + departments + the admin
  superuser only** (no contributor, no invites, no sample resources — an
  empty portal still needs its administrator). `docker-compose.yml` switches
  to it.
- **AC:** `DEBUG=False SECRET_KEY=x runserver` boots, serves SPA + media +
  API; `seed_data --production` on a fresh DB yields exactly 9 faculties /
  42 departments / 1 admin user and zero resources/contributors/invites.

### WS11 — Tests + CI
- Framework: Django's built-in runner + DRF `APITestCase` (no new deps).
- Required suites (backend): auth (login/me/refresh), invite lifecycle
  (generate/validate/register/expired/used/revoked), upload permissions
  (anon 401, contributor 201, deactivated 403), self-service (owner yes,
  other contributor no, admin yes; delete removes file), password reset
  lifecycle, download counting, rating endpoint.
- CI (`.github/workflows/ci.yml`): two jobs —
  backend: `pip install -r backend/requirements.txt` → `python manage.py test`
  (SQLite default); frontend: `npm ci` → `npm run build` (typecheck via build).
- **AC:** full suite green locally; CI config committed (runs on GitHub once
  the owner pushes).

### WS12 — Open-source polish + git
- `LICENSE` (MIT, "StudyShelf contributors").
- `CONTRIBUTING.md` (short: dev setup, branch/commit style, test expectation).
- README: badges (CI), features section refresh (dashboard, reset flow),
  screenshots placeholder section, `docs/` links.
- `git init` + structured commits: `chore: scaffold` is NOT used — repo starts
  with feature-sliced commits in dependency order (backend → frontend → docs →
  config), so history reads like deliberate engineering.
- New ADRs: **ADR-012** (contributor self-service & ownership), **ADR-013**
  (shareable-token password recovery, no SMTP). Update FEATURES.md and
  resolve rows C5/C6/D7 in DECISIONS-FOR-REVIEW.md.

---

## 4. Execution order & batching

WS1–WS5 (backend, one migration batch) → WS6–WS9 (frontend, one rebuild) →
WS10 → WS11 (tests written alongside each backend workstream, run continuously)
→ WS12 last. Backend and frontend verification gates after each batch; no
batch proceeds with a red gate.

## 5. Verification protocol

1. `python manage.py test` after every backend workstream.
2. curl-level API checks for every new/changed endpoint (status codes + JSON).
3. Browser pass after frontend batch: dashboard CRUD journey, reset journey
   (two browser profiles), admin flows, 390 px mobile pass.
4. Final gate: fresh-DB run — `migrate → seed_data --production → boot with
   DEBUG=False` → register-via-invite → upload → edit → delete → reset
   password → download, all green.

## 6. Definition of Done

- [ ] Every workstream's AC checked off with evidence (test names / screenshots / curl transcripts)
- [ ] Test suite green; CI config committed
- [ ] ADR-012, ADR-013 written; FEATURES.md, DECISIONS-FOR-REVIEW.md updated
- [ ] `.env.example`, LICENSE, CONTRIBUTING.md present; README polished
- [ ] Fresh-DB production-style boot verified
- [ ] Git initialized, clean sliced history, working tree clean
- [ ] Working tree contains no secrets, no `db.sqlite3`, no `venv`, no `media/`, no build artifacts

## 7. Guardrails (anti-derailment)

1. A change not in this document requires updating this document first.
2. No new runtime dependencies beyond what WS specs list (currently: none).
3. Existing behavior that works (PDF reader/X-Frame-Options fix, dark mode,
   invite flow, search, admin stats) must not regress — the test suite is the
   regression net; touch nothing it doesn't cover without adding a test first.
4. The owner's GitHub publish is manual, by hand, after DoD — never automated.
