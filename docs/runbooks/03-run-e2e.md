# Runbook 03 — Run the e2e suite

**Audience:** any developer or CI runner that needs to verify Sprint 1's auth + tenants code actually works at runtime, not just at compile time.

**Prereqs:** `pnpm` installed, Node 20+, a reachable Postgres whose schema matches `backend/prisma/schema.prisma`.

---

## Option A — Postgres via Docker (preferred, fastest)

If you have working Docker:

```bash
# from repo root
docker compose up -d postgres

# backend/.env (create it; copy from .env.example)
DATABASE_URL=postgres://postgres:postgres@localhost:6003/sms_monitor_test
JWT_SECRET=local-dev-secret-not-for-prod

# Apply the Prisma schema to the test DB
pnpm --filter @sms-monitor/backend exec prisma db push

# Run the e2e suite
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:6003/sms_monitor_test \
JWT_SECRET=local-dev-secret-not-for-prod \
pnpm exec jest --config ./test/jest-e2e.json --runInBand
```

Expected output: `Tests: 8 passed, 8 total`.

---

## Option B — Postgres via local install (no Docker)

```bash
# install Postgres 16 via your package manager
scoop install postgresql          # Windows (scoop)
brew install postgresql@16        # macOS
sudo apt install postgresql-16    # Ubuntu/Debian

# start the service (varies by OS)
brew services start postgresql@16 # macOS
sudo systemctl start postgresql   # Linux
# Windows: services.msc → "postgresql-x64-16" → Start

# create a test DB + user
createuser -s postgres            # if not already
createdb sms_monitor_test -O postgres
# set a password if your install didn't give postgres one
psql -c "ALTER USER postgres PASSWORD 'postgres';"

# then run the same commands as Option A
```

---

## Option C — Postgres-in-a-box (CI / sandboxed environments)

If neither Docker nor a system Postgres is available, you can use a portable npm-distributed Postgres (`embedded-postgres`). **This was attempted in-session and blocked because the native binary needs admin to install on Windows**; on Linux/macOS it usually works.

```bash
cd backend
pnpm add -D embedded-postgres@16.14.0-beta.17
# approve build scripts: add the binary packages to pnpm-workspace.yaml allowBuilds
pnpm install

# create test/global-setup.cjs (boots pg, applies schema, tears down)
# add to test/jest-e2e.json:  "globalSetup": "<rootDir>/global-setup.cjs"
# import in the test file or use it via globalSetup
```

A working `global-setup.cjs` skeleton is in the git history of this repo (was committed in a previous attempt; reverted when blocked on Windows). If you re-introduce it, make sure to gate the import on `process.platform` so Linux/macOS doesn't pay the cost on Windows.

---

## What the e2e suite covers

8 test cases, one per Sprint 1 acceptance criterion:

| AC | Test |
|---|---|
| AC-1 | signup happy path — 201, sets `jwt` + `refresh_jwt` cookies, returns `accessToken` |
| AC-2 | login happy path — 200, sets cookies |
| AC-3 | `GET /v1/me` with valid JWT — returns user + tenant |
| AC-4 | unauthenticated `GET /v1/me` — 401 |
| AC-5 | cross-tenant `GET /v1/tenants/<other>` — 404 (no enumeration) |
| AC-6 | stored `passwordHash` is bcrypt-formatted (`$2[aby]$...`), not plaintext |
| AC-9 | cross-tenant `PATCH /v1/tenants/<other>` — 404 |
| AC-12 | **regression**: raw `prisma.user.findMany()` outside any request throws "Tenant context is not set" |

---

## What the e2e suite does NOT cover (and what to do)

- **Manual browser smoke** — signup → login → `/v1/me` → `/dashboard`. Run after the e2e suite passes:
  ```bash
  pnpm dev:infra            # Postgres + Redis + MailHog
  pnpm --filter @sms-monitor/backend start:dev    # :6001
  pnpm --filter @sms-monitor/web dev              # :6002
  # open http://localhost:6002/signup
  ```
- **Refresh token rotation** — there is no e2e test for `/v1/auth/refresh` yet. Add one in Sprint 2.
- **Logout-everywhere** (revoke all refresh tokens) — not implemented; Sprint 2.
- **Rate limiting** — `@nestjs/throttler` not installed yet; Sprint 2 (per `auth.md` AC-10).
- **No web e2e (Playwright)** — Sprint 3+.

---

## Troubleshooting

- **`P1001: Can't reach database server`** — `DATABASE_URL` is wrong, or Postgres isn't running. `pg_isready -h localhost -p 5432`.
- **`P3009: migrate found drift`** — `pnpm prisma migrate reset --force` (only in dev).
- **`Tenant context is not set` in a test that should pass** — you imported the test as a `.spec.ts` (unit) instead of `.e2e-spec.ts` and Jest didn't pull in `globalSetup`; or the request didn't have a `jwt` cookie so the `JwtAuthGuard` returned 401 before the middleware seeded context.
- **CI: embedded-postgres fails on Windows runners** — switch the CI matrix to `windows-latest` ⇒ use a real Postgres service container, or set `runs-on: ubuntu-latest` only.
