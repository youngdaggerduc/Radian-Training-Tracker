# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Backend** (from `backend/`, venv at `backend/venv/`):
```bash
source venv/Scripts/activate            # Git Bash on Windows
uvicorn app.main:app --reload --port 8001   # dev server on :8001 (8000 often reserved by Hyper-V on Windows)
pip install -r requirements.txt         # after editing requirements
```

**Frontend** (from `frontend/`):
```bash
npm run dev                             # dev server on :5173
npm run build                           # production build -> dist/
npm run lint                            # eslint
```

**Migrations (Aerich)** — not yet initialized. Schema currently auto-generates via `generate_schemas=True` in `app/main.py`. First-time setup:
```bash
cd backend
aerich init -t app.config.TORTOISE_ORM
aerich init-db
# subsequent model changes:
aerich migrate && aerich upgrade
```
When switching to Aerich, remove or disable `generate_schemas=True` in `app/main.py` to avoid drift.

No test suite exists yet.

**Port already in use (WinError 10013)** — if `uvicorn` fails with a socket permissions error, a background process is holding port 8001. Free it with:
```powershell
Get-NetTCPConnection -LocalPort 8001 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```
Then re-run uvicorn normally.

## Architecture

Two independent apps, connected only over HTTP:

- **`backend/`** — FastAPI app. Entrypoint `app/main.py` wires CORS (allows `localhost:5173`), mounts routers from `app/routers/`, and calls `register_tortoise(...)` to bind Tortoise ORM to the app lifecycle. DB config lives in `app/config.py`, which reads `DATABASE_URL` from `backend/.env` (default: `sqlite://db.sqlite3`). Models in `app/models.py` are registered through the `TORTOISE_ORM["apps"]["models"]["models"]` list — new model modules must be added there, alongside `aerich.models`.

- **`frontend/`** — Vite + React. `vite.config.js` proxies `/api/*` to `http://localhost:8000`, so frontend code should call `fetch('/api/...')` with no host — this keeps dev and prod URL handling identical as long as prod serves the API under `/api`. The homepage is `src/App.jsx`.

**Adding a backend endpoint**: create a new module under `app/routers/`, define an `APIRouter`, and register it in `app/main.py` via `app.include_router(...)`. The `/api` prefix is set per-router (see `homepage.py`), not globally.

**Switching DB**: change `DATABASE_URL` in `backend/.env` (e.g., `postgres://...`) and add the matching driver (`asyncpg`) to `requirements.txt`. No code changes needed — Tortoise picks the dialect from the URL.

## Deployment Checklist

**Blockers — must do before go-live:**

1. **Create `backend/.env`** — file does not exist in the repo (gitignored). Without it, `SECRET_KEY` falls back to the hardcoded dev string in `auth.py` and tokens can be forged.
   ```
   SECRET_KEY=<64-char random string>
   DATABASE_URL=sqlite://db.sqlite3
   ```
   Generate the key: `python -c "import secrets; print(secrets.token_hex(32))"`

2. **Update CORS origins** — add `ALLOWED_ORIGINS=https://your-domain.com` to `backend/.env`. Defaults to localhost in dev; in production the server will reject requests from other origins without this set.

3. **Build the frontend** — `frontend/dist/` is gitignored and must be generated on the server:
   ```bash
   cd frontend && npm ci && npm run build
   ```
   FastAPI serves the built files automatically when `dist/` exists (see `app/main.py` bottom).

**Important — should fix:**

4. **Drop `--reload` in production** — use `uvicorn app.main:app --port 8001` (no `--reload`).

5. **Default password** — all seed accounts start with `radian2026`. Remind staff to change via the Settings icon in the sidebar on first login.

6. **Demo seed data** — on a fresh DB, `/api/state` seeds fake leads/trainees if the tables are empty. After setup, delete them via the UI or `DELETE FROM leads; DELETE FROM trainees;` directly in SQLite.

**Infrastructure (depending on host):**

7. **Process manager** — wrap uvicorn in systemd or supervisor so it restarts on crash/reboot.

8. **HTTPS** — put nginx or Caddy in front for SSL. Caddy handles Let's Encrypt automatically with minimal config.

9. **SQLite backup** — the entire DB is `backend/db.sqlite3`. A daily `cp` cron to a second location is sufficient.

---

## Hosting Guide — Vercel (frontend) + Render (backend)

This is the recommended free hosting setup. Vercel serves the React app (always fast, no sleep). Render runs the FastAPI backend (free tier sleeps after 15 min; upgrade to Starter at $7/month to remove sleep).

### Architecture in production

```
User → Vercel CDN → React app (static)
              ↓ API calls
         Render Web Service → FastAPI → PostgreSQL (Render or Neon)
```

The frontend calls the backend via the `VITE_API_BASE` environment variable. CORS is configured on the backend via `ALLOWED_ORIGINS`.

---

### Part 1 — Push code to GitHub

1. Create a new repository on GitHub (github.com → New repository). Name it e.g. `radian-training-tracker`. Keep it **private**.

2. In this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/radian-training-tracker.git
   git branch -M main
   git push -u origin main
   ```

3. Verify the push succeeded and that `.env`, `db.sqlite3`, `venv/`, `node_modules/`, `dist/`, `.claude/`, and `memory/` are **not** in the repository.

---

### Part 2 — Deploy the backend to Render

#### 2a. Create a PostgreSQL database on Render

1. Go to [render.com](https://render.com) and sign up / log in.
2. Click **New → PostgreSQL**.
3. Settings:
   - **Name**: `radian-db`
   - **Plan**: Free (note: Render free PostgreSQL expires after 90 days — see Neon alternative below)
   - **Region**: Choose closest to your users (e.g. Ohio for US/Caribbean)
4. Click **Create Database**.
5. On the database page, copy the **Internal Database URL** — you'll need it in the next step.

> **Neon alternative (free forever):** Instead of Render's PostgreSQL, create a free database at [neon.tech](https://neon.tech). Sign up, create a project, copy the connection string (starts with `postgresql://`). Neon's free tier has no expiry. Use that URL in place of Render's.

#### 2b. Create the web service on Render

1. Click **New → Web Service**.
2. Connect your GitHub account and select your `radian-training-tracker` repository.
3. Settings:
   - **Name**: `radian-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
4. Click **Advanced** → **Add Environment Variable** and add all three:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | The PostgreSQL URL from step 2a (starts with `postgresql://`) |
   | `SECRET_KEY` | Generate one: `python -c "import secrets; print(secrets.token_hex(32))"` — paste the output |
   | `ALLOWED_ORIGINS` | Leave blank for now — you'll fill this in after deploying Vercel |

5. Click **Create Web Service**. Render will install dependencies and start the server. This takes 2–4 minutes on first deploy.

6. Once the deploy shows **Live**, copy the service URL — it looks like `https://radian-backend.onrender.com`. You'll need this for Vercel.

7. Now go back to **Environment** and set:

   | Key | Value |
   |-----|-------|
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (the Vercel URL from Part 3) |

   Click **Save Changes** — Render will redeploy automatically.

---

### Part 3 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in with GitHub.
2. Click **Add New → Project**.
3. Import your `radian-training-tracker` repository.
4. Settings:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Click **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE` | `https://radian-backend.onrender.com` (your Render URL, **no trailing slash**) |

6. Click **Deploy**. Vercel builds the frontend and gives you a URL like `https://radian-training-tracker.vercel.app`.

7. Copy this Vercel URL and paste it into the `ALLOWED_ORIGINS` environment variable on Render (step 2b-7 above).

---

### Part 4 — Post-deployment setup

#### Test the deployment

1. Open your Vercel URL in a browser.
2. Log in with `pierce` / `radian2026`.
3. If the login hangs for ~30 seconds on first attempt, that is normal — Render's free tier is waking up.
4. After login, verify the dashboard loads and leads/trainees appear (seed data on fresh DB).

#### Delete seed data

On a fresh database, the app seeds fake leads and trainees on first load. Delete them:

1. Log in as an admin.
2. Go to each lead and trainee and delete them via the drawer → Actions → Delete.
3. Or connect to the PostgreSQL database directly and run:
   ```sql
   DELETE FROM leads;
   DELETE FROM trainees;
   ```

#### Change all staff passwords

All accounts start with password `radian2026`. Each staff member should:
1. Log in.
2. Click the **Settings** icon (gear) in the sidebar footer.
3. Enter current password `radian2026` and choose a new password.

#### Add a custom domain (optional)

- **Vercel**: Project → Settings → Domains → Add your domain. Vercel handles SSL automatically.
- **Render**: Service → Settings → Custom Domains. Also handles SSL automatically.

---

### Part 5 — Ongoing maintenance

#### Redeploying after code changes

1. Push changes to GitHub (`git push`).
2. Render and Vercel both auto-detect the push and redeploy within 2–3 minutes.
3. No manual steps needed.

#### Upgrading Render to remove sleep (when ready to pay)

1. Go to your web service on Render.
2. Settings → Plan → **Starter ($7/month)**.
3. The service will no longer sleep. First load is instant for all users.

#### Database backups

From the Render PostgreSQL dashboard (or Neon dashboard), you can download a backup at any time. For automated backups, Render's paid database plans include daily backups. For the free Neon tier, use their point-in-time restore feature.

#### Adding new staff accounts

Log in as an admin → **Staff Accounts** (sidebar) → **Add Staff Member**. New accounts use `radian2026` as the default password — remind the staff member to change it on first login.

---

### Environment variable reference

**Render (backend):**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | JWT signing key — 64 hex chars, never share | `e0d57bfe...` |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend URLs | `https://your-app.vercel.app` |

**Vercel (frontend):**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE` | Render backend URL, no trailing slash | `https://radian-backend.onrender.com` |
