# 🎓 StudyShelf

[![CI](https://github.com/YOUR_GITHUB_USERNAME/studyshelf/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/studyshelf/actions/workflows/ci.yml)

A modern academic resource portal where students browse, read in-browser, and
download course materials (lecture notes, handouts, past questions) organized
by faculty and department — **no student account needed**. Uploads are restricted to
**contributors** who are invited by the administrator through one-time invite
links.

## ✨ Features

- **Public browsing & downloads** — no login required for students
- **Faculty → Department navigation** — 9 faculties, 40+ departments in a collapsible sidebar
- **Search** — by title, course code, filename or description
- **Contributor uploads** — batch drag & drop (PDF, DOCX, PPTX, TXT, images), 50 MB/file
- **Invite system** — admin generates one-time, expiring invite links; shares them manually (WhatsApp, email…)
- **Download counters** — tracked per resource
- **Upvotes** — students rate resources; anti-spam via localStorage (one vote per browser)
- **Recent downloads** — last 3 downloads surfaced on the home page (localStorage)
- **Dark mode** — persisted toggle in the header
- **Admin dashboard** — stats, invite management, contributor management (deactivate, password-reset links), faculty/department-filtered resource management
- **Contributor dashboard** — personal impact stats, edit/delete own uploads
- **Password recovery without email** — admins generate one-time 24h reset links (ADR-013)
- **Images render inline**; PDFs read in-browser natively
- **Tested & CI'd** — 38-test backend suite, GitHub Actions
- **REST API docs** — Swagger UI at `/api/docs/`

## 🛠 Tech Stack

| Layer     | Tech                                                        |
|-----------|-------------------------------------------------------------|
| Backend   | Django 5.1 + Django REST Framework + SimpleJWT              |
| Frontend  | React 18 + TypeScript + Tailwind CSS + React Router v6      |
| Database  | SQLite (dev) / PostgreSQL (Docker)                          |
| Serving   | Django serves the built SPA + API from one origin           |
| Deploy    | Docker Compose                                              |

## 🚀 Quick Start (local development)

### 1. Backend

```bash
python -m venv venv
venv\Scripts\activate            # Windows (Git Bash: source venv/Scripts/activate)
pip install -r backend/requirements.txt

cd backend
python manage.py migrate
python manage.py seed_data       # faculties, departments, users, 44 sample PDFs
python manage.py runserver 8000
```

### 2. Frontend (only when developing the UI)

```bash
cd frontend
npm install
npm run dev                      # Vite dev server on :5173 (proxies /api to :8000)
```

### 3. Production-style single-server run

```bash
cd frontend
npm run build:unified            # builds and copies the SPA into backend/static
cd ../backend
python manage.py runserver 8000
```

Open **http://localhost:8000** — Django serves the React app and the API together.

> ⚠️ If port 8000 answers with a *different* app, another server is squatting on
> the port — run `python manage.py runserver 8010` instead.

## 👤 Seeded accounts

| Role        | Username      | Password         |
|-------------|---------------|------------------|
| Admin       | `admin`       | `admin123`       |
| Contributor | `contributor` | `contributor123` |

A **demo invite link** is also seeded (check the admin dashboard → Invites,
or the Django admin at `/admin/`).

## 🐳 Docker deployment

```bash
docker compose up --build
```

That starts PostgreSQL, migrates, seeds data (idempotent), and serves the
unified app with gunicorn on **http://localhost:8000**.

## 🔌 API overview

Interactive docs: **`/api/docs/`** (Swagger, via drf-spectacular).

| Endpoint                          | Method      | Auth          | Purpose                              |
|-----------------------------------|-------------|---------------|--------------------------------------|
| `/api/faculties/`                 | GET         | public        | Faculties with nested departments    |
| `/api/resources/`                 | GET         | public        | List/filter/search resources         |
| `/api/resources/`                 | POST        | contributor   | Batch upload (multipart)             |
| `/api/resources/{id}/`            | GET         | public        | Resource detail                      |
| `/api/resources/{id}/download/`   | POST        | public        | Increment count + stream file        |
| `/api/resources/{id}/rate/`       | POST        | public        | Upvote a resource                    |
| `/api/auth/login/`                | POST        | public        | JWT login                            |
| `/api/auth/register/`             | POST        | public        | Register using invite token          |
| `/api/auth/me/`                   | GET         | JWT           | Current user                         |
| `/api/invites/`                   | GET/POST    | admin         | List / generate invite links         |
| `/api/invites/validate/?token=`   | GET         | public        | Check invite validity                |
| `/api/admin/resources/`           | CRUD        | admin         | Full resource management             |
| `/api/admin/stats/`               | GET         | admin         | Dashboard statistics                 |

## 📁 Project structure

```
Uni Resource Portal/
├── backend/
│   ├── config/            # settings, urls, wsgi
│   ├── apps/
│   │   ├── users/         # custom User (admin | contributor)
│   │   ├── faculties/     # Faculty & Department
│   │   ├── resources/     # Resource model (file, stats, ratings)
│   │   ├── invites/       # InviteToken (one-time, expiring, revocable)
│   │   ├── api/           # DRF serializers, views, urls, permissions
│   │   └── core/          # SPA view + seed_data command
│   ├── static/            # ← React build lands here (build:unified)
│   └── media/             # uploaded files
├── frontend/
│   ├── src/components/    # Layout, Sidebar, ResourceCard, RatingButton…
│   ├── src/pages/         # Home, Browse, ResourceDetail, Upload, Admin…
│   ├── src/hooks/         # useDarkMode, useAuth, useRecentDownloads, useRatedResources
│   └── scripts/copy-to-backend.js
├── docker-compose.yml
└── Dockerfile
```

## 📚 More docs

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — system design & diagrams
- **[docs/adr/](docs/adr/)** — 13 Architecture Decision Records
- **[docs/FEATURES.md](docs/FEATURES.md)** — blueprint vs delivered, honestly
- **[HOW_TO_DEMO.md](HOW_TO_DEMO.md)** — step-by-step presentation script
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** — day-to-day admin operations
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — dev setup & ground rules
