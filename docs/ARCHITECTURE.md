# StudyShelf — Architecture

> StudyShelf is an open academic resource portal: students browse, read in-browser,
> and download course materials with no account; invited contributors upload;
> an admin curates and governs. This document describes the system as built (v1).

## 1. System context

```
┌──────────────┐        ┌──────────────────────────────────────────┐
│   Student    │──────▶ │                                          │
│  (no login)  │        │                StudyShelf                │
└──────────────┘        │  ┌────────────┐      ┌───────────────┐   │
┌──────────────┐        │  │  React SPA │◀───▶ │  Django REST  │   │
│ Contributor  │──────▶ │  │  (browser) │ JSON │     API       │   │
│ (invite only)│        │  └────────────┘      └───────┬───────┘   │
└──────────────┘        │                              │           │
┌──────────────┐        │  ┌────────────┐      ┌───────▼───────┐   │
│    Admin     │──────▶ │  │ Django     │      │ Database      │   │
│              │        │  │ admin + SPA│      │ SQLite/Postgres│  │
└──────────────┘        │  └────────────┘      └───────────────┘   │
                        │            media files on server disk    │
                        └──────────────────────────────────────────┘
```

- **Students** use only the SPA. No authentication, ever.
- **Contributors** authenticate with JWT (username/password) obtained at login
  or automatically at invite registration.
- **Admins** use both the SPA dashboard and Django admin (`/admin/`).

## 2. Container view (repo layout)

```
backend/                     Django 5.x project (serves API + SPA + media)
├── config/                  settings, root urls, wsgi/asgi
├── apps/
│   ├── users/               custom User (role: admin | contributor)
│   ├── faculties/           Faculty, Department  (taxonomy)
│   ├── resources/           Resource (file, counters, ratings)
│   ├── invites/             InviteToken (one-time, expiring, revocable)
│   ├── api/                 DRF serializers, views, permissions, routes
│   └── core/                SPA view + `seed_data` management command
├── static/                  ← React build output (gitignored build artifact)
└── media/                   ← uploaded files (resources/%Y/%m/)

frontend/                    React 18 + TypeScript + Vite + Tailwind
├── src/pages/               Home, Browse, ResourceDetail, Upload, Admin,
│                            InviteRegister, Login
├── src/components/          Layout (sidebar), ResourceCard, RatingButton, …
├── src/hooks/               useAuth, useDarkMode, useRecentDownloads,
│                            useRatedResources
└── scripts/copy-to-backend.js   copies dist/ → backend/static
```

One origin in production: Django serves the SPA from `/static/`, the API under
`/api/`, media under `/media/`, and admin under `/admin/`. No CORS in prod.

## 3. Data model

```
Faculty 1 ──── * Department 1 ──── * Resource * ──── 1 User (uploaded_by)
                                     │
User 1 ──── * InviteToken * ──── 1 User (used_by)
```

| Model         | Key fields                                             | Notes |
|---------------|--------------------------------------------------------|-------|
| `User`        | `role` (admin/contributor), `full_name`, `department`   | extends `AbstractUser`; `is_active_contributor` gate |
| `Faculty`     | `name`, `slug`, `description`, `icon`                   | icon = lucide name rendered by the SPA |
| `Department`  | `faculty` FK, `name`, `slug`                            | unique `(faculty, slug)` |
| `Resource`    | `title`, `course_code`, `department` FK, `file`, `file_name`, `file_type`, `file_size`, `download_count`, `rating_sum`, `rating_count`, `is_featured`, `is_approved` | `average_rating` is a computed property; `file_type` derived from extension |
| `InviteToken` | `token` (urlsafe 32B), `expires_at`, `is_used`, `used_by`, `is_revoked`, `note` | created only by admins |

## 4. Request lifecycles

### 4.1 Anonymous browse & download
```
SPA ──GET /api/resources/?faculty=…&search=…──▶ DRF list view (public)
SPA ──POST /api/resources/{id}/download/──────▶ increment counter,
                                                FileResponse(stream, as_attachment)
```
The download endpoint *streams through Django* rather than redirecting to the
file URL — this guarantees the counter is accurate and the filename is
preserved, at the cost of server bandwidth. Revisit if traffic grows (ADR-006).

### 4.2 Invite → contributor registration
```
Admin ──POST /api/invites/──▶ InviteToken.generate()  (secrets.token_urlsafe(32))
Admin ── shares https://…/invite/{token} manually (WhatsApp/email/…)
Invitee ──GET /api/invites/validate/?token=…──▶ {valid: true/false}
Invitee ──POST /api/auth/register/ {token, username, …}
          ├─ token valid? not used, not revoked, not expired
          ├─ username/email free?
          └─ create User(role=contributor) + invite.use(user)  [atomic enough for v1]
          ◀── {user, access, refresh}   (auto-login)
```

### 4.3 Upload (batch)
```
Contributor ──POST multipart /api/resources/
              fields: files[], department, course_code?, description?
              ├─ permission: IsAuthenticatedContributor
              ├─ per-file validation: ≤ 50 MB (frontend mirrors this)
              ├─ title derived from filename (underscores/dashes → spaces)
              └─ one Resource row per file, file saved to media/resources/%Y/%m/
```

## 5. Frontend architecture

- **State**: no global store; server state via per-page `useEffect` + axios;
  client-persistent state (dark mode, recent downloads, rated resources) in
  `localStorage` through small dedicated hooks. Chosen deliberately for scale
  (see ADR-003/ADR-005).
- **Routing**: React Router v6 with a `Layout` route wrapper; sidebar fetches
  `/api/faculties/` once and expands/collapses locally; routes
  `/browse/:faculty/:department?` map 1:1 to API filters.
- **Auth**: `AuthContext` + axios interceptor; on 401 the interceptor
  refreshes the token once and **replaces the stale Authorization header**
  before retrying (a bug we fixed — see FEATURES.md).
- **Theming**: `dark` class on `<html>`, persisted in localStorage, Tailwind
  `darkMode: 'class'`.

## 6. Environments

| Concern        | Dev (current)                    | Production (target)            |
|----------------|----------------------------------|--------------------------------|
| Database       | SQLite (`db.sqlite3`)            | PostgreSQL (docker-compose)    |
| Files          | local `media/`                   | local `media/` + volume        |
| Server         | `runserver 8010/8011`            | gunicorn 3 workers (compose)   |
| Static         | Django serves `backend/static`   | WhiteNoise (compress/manifest) |
| `DEBUG`        | `True`                           | `False` + fixed `ALLOWED_HOSTS`|
| Secrets        | default dev key                  | env `SECRET_KEY`, `.env` not committed |
| Media in dev   | served by `django.views.static`  | Django/gunicorn serves (or Nginx later) |

## 7. Trust boundaries & current limits (honest list)

1. **Rating anti-spam is localStorage-based** — trivially bypassed by clearing
   storage or scripting requests. Accepted for v1 (ADR-005); server-side
   rate limiting is the future fix.
2. **Upload validation checks size and extension-derived type**, not file
   *content*. A renamed `.exe` stored as `other` is possible. Accepted for the
   trusted-contributor model; content sniffing is on the roadmap.
3. **No pagination** on resource lists — fine at hundreds of rows, wrong at
   tens of thousands (flagged in ADR-010).
4. **No HTTPS termination** configured — deployment concern, handled at the
   edge (Nginx/Caddy/PaaS) when production lands.

## 8. Open-source + institutional fork strategy

The public repo is the **open core**. The university deployment, if it
happens, is a **private fork** where branding, secrets, and any hardened
security logic live. Rules that keep the fork cheap and safe:

- No secrets in the repo, ever (`.env` gitignored; `.env.example` provided).
- No institution-specific names/configs hardcoded in code.
- All environment-specific values flow through environment variables.
