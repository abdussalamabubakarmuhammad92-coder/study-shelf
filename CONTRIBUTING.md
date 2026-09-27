# Contributing to StudyShelf

Thanks for your interest in improving StudyShelf! This project aims to be a
clean, well-engineered academic resource portal — contributions that keep it
that way are welcome.

## Development setup

```bash
# backend
python -m venv venv
venv\Scripts\activate            # or source venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py seed_data       # demo content for development
python manage.py runserver 8000

# frontend (dev server with API proxy)
cd ../frontend
npm install
npm run dev                      # http://localhost:5173
```

`npm run build:unified` produces the production build served by Django from
one origin.

## Ground rules

1. **Run the tests.** `python manage.py test` must pass before any PR is
   reviewed. New backend behavior needs new tests — that's the regression net.
2. **Write an ADR for significant decisions.** If you introduce a dependency,
   change storage/auth architecture, or make a tradeoff, add
   `docs/adr/ADR-0NN-*.md` (context → decision → alternatives → consequences).
3. **No secrets, ever.** Configuration flows through environment variables;
   `.env` is gitignored; `.env.example` documents the expected shape.
4. **Keep the core generic.** Institution-specific names, taxonomies, or
   policies belong in seed data or forks, not in code (see ADR-011).
5. **Match the existing style** — Django idiom on the backend, typed React
   function components + Tailwind utilities on the frontend.

## Commit style

Short imperative subjects, scoped when useful:
`feat(backend): ...`, `fix(frontend): ...`, `docs: ...`, `chore(ci): ...`.

## Proposing features

Open an issue describing the problem before the solution. Feature work with a
written acceptance criterion gets merged faster.
