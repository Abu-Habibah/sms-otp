# Runbook 01 — Local Development Setup

## Goal

Bring up the SMS Monitor v2.0 monorepo (backend + web + Postgres + Redis) on a fresh dev machine.

## Prerequisites

| Tool | Min version | Install |
|---|---|---|
| Node.js | 20+ | `nvm install 20` or `scoop install nodejs` |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker Desktop | latest | `winget install Docker.DockerDesktop` (Windows) |
| (Windows) WSL2 | latest | Required by Docker Desktop |

## Steps

```bash
# 1. Clone
git clone <repo-url>
cd SMS-OTP

# 2. Install workspace dependencies
pnpm install

# 3. Start Postgres + Redis (MailHog is included too)
pnpm dev:infra

# 4. Copy backend env
cp backend/.env.example backend/.env
# Edit backend/.env if needed (defaults work for the docker-compose stack)

# 5. Run Prisma migration
pnpm prisma:migrate

# 6. Start the backend (port 3000)
pnpm dev:backend

# 7. In another terminal — start the web (port 3001)
pnpm dev:web

# 8. Smoke test
curl http://localhost:6001/health
open http://localhost:6002
```

## Verification

- Backend health: `curl http://localhost:6001/health` → 200 `{"status":"ok"}`
- Web: `http://localhost:6002` renders the landing page
- DB: `pnpm prisma:studio` opens Prisma Studio at `http://localhost:5555`
- MailHog: `http://localhost:6006` (any transactional emails land here)

## Rollback

- Stop everything: `pnpm dev:infra:down`
- Nuke volumes: `docker compose down -v`
- Wipe node_modules: `pnpm clean && pnpm install`
