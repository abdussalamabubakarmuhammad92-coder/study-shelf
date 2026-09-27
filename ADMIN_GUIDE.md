# 🛡 Admin Guide — University Resource Portal

Everything an administrator needs day-to-day.

## Logging in

1. Go to **http://localhost:8000/login**
2. Sign in with your admin account (seeded default: `admin / admin123`).
3. You land on the **Admin dashboard** with three tabs: Stats, Invites, Resources.

## Inviting contributors

Contributors are **never created by hand** — they self-register through invite
links you generate.

1. Admin dashboard → **Invites** tab.
2. (Optional) Add a note, e.g. *"PHY 200 level class rep"* — helps you track
   who the link belongs to.
3. Click **Generate invite link**.
4. Click **Copy link** and send it to the person via WhatsApp, email, SMS…
5. They open the link, register, and immediately get upload access.

### Invite rules

- Each invite is **one-time use** — after registration it's marked *Used* and
  the link stops working.
- Invites **expire after 7 days** (the seed script's demo invite lasts 30).
- Expired/used links show a friendly error page with a contact hint.

### Revoking an invite

If a link leaks or you change your mind:

- Admin dashboard → Invites: only unused invites can be copied; a leaked
  unused invite can be revoked via the Django admin at `/admin/` →
  **Invite tokens** → select → **Revoke selected invites**.
- To remove a contributor's upload ability entirely, Django admin → **Users**
  → untick *Contributor status* (`is_active_contributor`).

## Managing resources

Admin dashboard → **Resources** tab:

- **Search** by title, course code or filename.
- **Delete** removes both the database record and the stored file. You'll be
  asked to confirm.
- For finer control (featuring, approving, editing metadata), use the Django
  admin at `/admin/` → **Resources**:
  - tick/untick **Featured** (pinned to the home page),
  - untick **Approved** to hide a resource from the public site without
    deleting it.

## Reading the stats

Stats tab shows:

| Metric           | Meaning                                     |
|------------------|---------------------------------------------|
| Resources        | total uploaded files                        |
| Total downloads  | sum of all download counters                |
| Ratings given    | total upvotes across the portal             |
| Contributors     | registered uploader accounts                |
| Resources by faculty | quick coverage view — faculties with 0 resources need attention |
| Most downloaded  | top-5 leaderboard                           |

## Changing your password

Use Django admin → **Users** → your user → *Password* form, or:

```bash
cd backend
python manage.py changepassword admin
```

## Creating more admins

Django admin → **Users** → *Add user* → set role to **Administrator**, or:

```bash
python manage.py createsuperuser
```

(then edit the user in Django admin and set *role = admin* so they see the
dashboard.)

## Backups

All data lives in two places:

- **Database** — `backend/db.sqlite3` (local) or the `postgres_data` Docker volume
- **Uploaded files** — `backend/media/` (local) or the `media_data` volume

Back both up; restoring both restores everything.
