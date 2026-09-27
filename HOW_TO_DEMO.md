# 🎤 How to Demo — University Resource Portal

A 5–7 minute presentation script that shows off every feature in order.
Before you start: make sure the server is running (`python manage.py runserver
8000`) and seed data exists (`python manage.py seed_data` — safe to re-run).

> 💡 Open the browser's DevTools → *Device toolbar* (Ctrl+Shift+M) at the end
> to show the mobile responsiveness.

## 1. Home — open browsing, no login

Open **http://localhost:8000**

- Point out the hero: "any student, no account, free downloads".
- Show **search**: type `CSC` and hit Enter → results for course codes.
- Scroll to **Featured resources** and **Recently uploaded**.
- If you've downloaded something before, the **Your recent downloads** strip
  appears (localStorage-powered).

## 2. Sidebar navigation — 9 faculties

- Click **Faculties → Faculty of Computing** in the left sidebar — it expands
  to show departments with resource counts.
- Click **Computer Science** → the resource grid filters.
- Note the file-type badges (PDF/DOCX/PPTX), download counts, ratings.

## 3. Resource detail, download & rating

- Click any resource card.
- Show the file info (name, size, downloads) and click **Download** — a real
  PDF opens, the download counter ticks up.
- Return and click **Rate this resource** → the rating updates.
- Refresh the page → the button now shows **Rated** (anti-spam via
  localStorage: one vote per browser).

## 4. Dark mode

- Toggle the moon/sun button in the header. Mention it persists across
  refreshes.

## 5. Admin dashboard

- Log in via **Contributor Login** with `admin / admin123`.
- You're taken to the **Admin dashboard**:
  - **Stats tab** — totals (resources, downloads, ratings, contributors),
    "Resources by faculty" bar chart, "Most downloaded" leaderboard.
  - **Invites tab** — type a note like *"CSC 300 level class rep"* → click
    **Generate invite link** → **Copy link**. Say: *"I send this link on
    WhatsApp; the person registers without me creating anything manually."*
  - **Resources tab** — search, and delete a resource (deletes the file too).

## 6. Invite flow — becoming a contributor

- Open the copied invite link (paste it in a new tab or, even better, an
  incognito window).
- Show the **Valid invite** badge, then register a fake student
  (name/username/email/password) → you land on the **Upload page**.
- Go back to Admin → Invites: the invite is now marked **Used** — the link is
  dead for anyone else. That's the security story.

## 7. Contributor upload

- On the **Upload page**, drag & drop 2–3 files at once (batch!).
- Pick Faculty → Department, type a course code (`CSC301`) and a short
  description → **Upload** with a live progress bar.
- The uploaded files link straight to their public pages.

## 8. Extras to mention if asked

- **API docs** at `/api/docs/` (Swagger).
- **Django admin** at `/admin/` (superuser `admin/admin123`) for raw data.
- **Docker**: `docker compose up --build` → production-style deployment.
- Mobile: sidebar collapses behind a hamburger menu.
