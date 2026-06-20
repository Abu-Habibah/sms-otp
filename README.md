# SMS Monitor

Multi-tenant SMS monitoring platform. Tenants register, claim Android devices, and configure forwarding to their own systems (CRM, School Management, HRIS, etc.).

**v1.0** (Android + test Express backend) shipped and sealed in `src-backup/v1.0/`. **v2.0** (NestJS + Postgres + Redis + Next.js web admin) is in **Sprint 1 — Auth & Tenants (build-verified; runtime verification deferred to next session)**. Sprint 2 (Devices & Claim Codes) is scoped and ready to start as soon as the dev-infra problem (Postgres on this host) is resolved.

---

## Quickstart

### Option 1: Docker (Recommended)

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd sms-otp

# 2. Start everything (Postgres, Redis, MailHog, Backend, Web)
docker compose up -d

# 3. Verify
curl http://localhost:3000/health   # Backend
open http://localhost:3001          # Web admin
open http://localhost:8025          # MailHog UI
```

### Option 2: Local Development

```bash
# 1. Install pnpm (workspace manager)
npm install -g pnpm

# 2. Install all workspace dependencies
pnpm install

# 3. Bring up local infrastructure (Postgres 16, Redis 7, MailHog)
pnpm dev:infra

# 4. Apply the Prisma migration (creates the schema in Postgres)
pnpm prisma:migrate

# 5. Start the backend (NestJS, :3000)
pnpm dev:backend

# 6. In another terminal, start the web admin (Next.js, :3001)
pnpm dev:web
```

Verify:
- `curl http://localhost:3000/health` → `{"status":"ok"}`
- `http://localhost:3001` renders the landing page
- `http://localhost:5555` opens Prisma Studio (run `pnpm prisma:studio`)

---

## Repository layout

```
.
├── app/                  Android client (Kotlin) — v1.0, untouched in Sprint 0
├── backend/              NestJS API — Sprint 0 (skeleton)
├── web/                  Next.js admin dashboard — Sprint 0 (skeleton)
├── packages/
│   └── shared-types/     Zod schemas + TS types shared by backend & web
├── test-backend/         Legacy Express test server (v1.0 reference)
├── docs/                 All project documentation
└── src-backup/
    └── v1.0/             Sealed snapshot of the v1.0 working state
```

---

## Project Documentation

Per project-rules Rule 5, every document in this repo must be reachable from here. Alphabetized within each category.

### 🏷 System Prefixes

Per project-rules Rule 9 (v1.1, Build: 001), every documentation file uses a system-prefix-based naming convention. Standard format: `<prefix>-<type>-<name>.md`.

| System | Prefix | Description | Owner |
|--------|--------|-------------|-------|
| Web Admin | `web` | Next.js 14 admin dashboard (`web/`) | Frontend Team |
| Backend API | `be` | NestJS REST API (`backend/`) | Backend Team |
| Android Monitor | `an-monitor` | Android SMS monitor client (`app/`) | Mobile Team |
| Database | `db` | Prisma schema + migrations (`backend/prisma/`) | Backend Team |
| DevOps | `ops` | Docker, CI/CD, deployment | DevOps Team |
| Shared | `shared` | Cross-system types & utilities (`packages/shared-types/`) | All Teams |

**Standard prefixes:** `web` (frontend), `be` (backend), `an-{variant}` (Android), `ios-{variant}` (iOS), `db` (database), `ops` (DevOps), `shared` (cross-system).

> **Note:** This table is registered. Renaming/moving existing docs to comply with the prefix convention is **deferred to explicit user approval** — see CHANGELOG "Rule 9 Compliance" entry.

### 📋 Project Overview
- [CHANGELOG.md](CHANGELOG.md) — Version history and release notes
- [PROJECT_PLAN.md](PROJECT_PLAN.md) — Master project plan and original v1.0 requirements
- [README.md](README.md) — This file: project overview and documentation index
- [src-backup/v1.0/README.md](src-backup/v1.0/README.md) — v1.0 baseline manifest

### 🏗 Architecture & Design
- [docs/architecture/build-toolchain.md](docs/architecture/build-toolchain.md) — Gradle, Kotlin, NestJS, Next.js toolchain versions
- [docs/architecture/system-overview.md](docs/architecture/system-overview.md) — v1.0 architecture (Android + test Express backend)
- [docs/architecture/v2.0-overview.md](docs/architecture/v2.0-overview.md) — v2.0 architecture, data model, and 7 ADRs

### ✨ Features
- [docs/features/android-enhancements.md](docs/features/android-enhancements.md) — Android security, performance, and architecture improvements (Sprint 5 — ✅ implemented)
- [docs/features/auth.md](docs/features/auth.md) — v2.0 feature spec for authentication (signup, login, refresh, logout, JWT, refresh-token rotation)
- [docs/features/backend-forwarding.md](docs/features/backend-forwarding.md) — v1.0 feature spec for SMS forwarding
- [docs/features/claim-codes.md](docs/features/claim-codes.md) — v2.0 feature spec for device claim codes (Sprint 2 — ✅ implemented)
- [docs/features/devices.md](docs/features/devices.md) — v2.0 feature spec for device records + per-device API keys (Sprint 2 — ✅ implemented)
- [docs/features/device-onboarding.md](docs/features/device-onboarding.md) — v2.0 Android device onboarding flow (QR + manual entry fallback)
- [docs/features/keyword-configuration.md](docs/features/keyword-configuration.md) — v1.0 feature spec for keyword filtering (Sprint 3 — ✅ implemented)
- [docs/features/sms-monitoring.md](docs/features/sms-monitoring.md) — v1.0 feature spec for SMS capture (Sprint 4 — ✅ implemented)
- [docs/features/tenants.md](docs/features/tenants.md) — v2.0 feature spec for tenant management (multi-tenant isolation, slug, roles)

### 🐛 Bugs & Issues
- [docs/bugs/known-issues.md](docs/bugs/known-issues.md) — Active known issues
- [docs/bugs/resolved.md](docs/bugs/resolved.md) — Resolved issues (regression reference)

### 🏃 Sprints & Planning
- [docs/sprints/backlog.md](docs/sprints/backlog.md) — v1.0 phases 1-4 backlog (complete)
- [docs/sprints/v2.0/sprint-0-foundation.md](docs/sprints/v2.0/sprint-0-foundation.md) — Sprint 0 (Foundation) — ✅ complete
- [docs/sprints/v2.0/sprint-1-auth-tenants.md](docs/sprints/v2.0/sprint-1-auth-tenants.md) — Sprint 1 (Auth & Tenants) — ✅ complete
- [docs/sprints/v2.0/sprint-2-devices-claim-codes.md](docs/sprints/v2.0/sprint-2-devices-claim-codes.md) — Sprint 2 (Devices & Claim Codes) — ✅ complete
- [docs/sprints/v2.0/sprint-3-keywords.md](docs/sprints/v2.0/sprint-3-keywords.md) — Sprint 3 (Keywords) — ✅ complete
- [docs/sprints/v2.0/sprint-4-sms-ingest-forwarder.md](docs/sprints/v2.0/sprint-4-sms-ingest-forwarder.md) — Sprint 4 (SMS Ingest & Forwarder) — ✅ complete
- [docs/sprints/v2.0/sprint-5-android-client.md](docs/sprints/v2.0/sprint-5-android-client.md) — Sprint 5 (Android v2.0 Client — Device Onboarding) — ✅ complete
- [docs/sprints/v2.0/sprint-6-keyword-sync.md](docs/sprints/v2.0/sprint-6-keyword-sync.md) — Sprint 6 (Backend Keyword Sync) — ✅ complete
- [docs/sprints/v2.0/sprint-7-sms-ingest.md](docs/sprints/v2.0/sprint-7-sms-ingest.md) — Sprint 7 (SMS Ingest v2.0) — ✅ complete
- [docs/sprints/v2.0/sprint-8-api-completion-cleanup.md](docs/sprints/v2.0/sprint-8-api-completion-cleanup.md) — Sprint 8 (API Completion & Cleanup) — ✅ complete
- [docs/sprints/v2.0/sprint-9-workspaces.md](docs/sprints/v2.0/sprint-9-workspaces.md) — Sprint 9 (Workspaces) — ✅ complete

### 📖 Runbooks & Operations
- [docs/runbooks/01-local-dev.md](docs/runbooks/01-local-dev.md) — Bring up the monorepo on a fresh dev machine
- [docs/runbooks/02-smoke-test.md](docs/runbooks/02-smoke-test.md) — Manual end-to-end smoke test
- [docs/runbooks/03-run-e2e.md](docs/runbooks/03-run-e2e.md) — Run the Sprint 1 e2e suite (needs Postgres)
- [docs/runbooks/04-android-v2-smoke-test.md](docs/runbooks/04-android-v2-smoke-test.md) — Android v2.0 device claim flow smoke test
- [docs/runbooks/README.md](docs/runbooks/README.md) — Index of operational runbooks
- [docs/MIGRATION.md](docs/MIGRATION.md) — v1.0 → v2.0 migration guide

### 🧪 Testing & Quality
- [docs/testing/qa-checklist.md](docs/testing/qa-checklist.md) — Pre-PR / pre-merge / pre-release checklist
- [docs/testing/test-plan.md](docs/testing/test-plan.md) — Test strategy, pyramid, coverage targets, CI gates

### 🤖 AI Agent Configuration
- [.opencode/opencode.json](.opencode/opencode.json) — OpenCode project config (loads project-rules, ui-ux-pro-max, prompt-rules skills)
- [.opencode/skills/project-rules/SKILL.md](.opencode/skills/project-rules/SKILL.md) — Project rules skill (auto-doc, sprint planning, bug tracking, 9 rules — v1.1 Build: 002)
- [.opencode/skills/ui-ux-pro-max/SKILL.md](.opencode/skills/ui-ux-pro-max/SKILL.md) — UI/UX design intelligence skill (67 styles, 161 palettes, 13+ stacks)
- [.opencode/skills/prompt-rules/SKILL.md](.opencode/skills/prompt-rules/SKILL.md) — Prompt generation & execution management skill (2 rules, Phase 0 validation, session system assignment — v1.1 Build: 001)
- [.opencode/prompts/ui-ux-pro-max.md](.opencode/prompts/ui-ux-pro-max.md) — Reusable agent prompt template for UI/UX tasks
- [.opencode/prompts/sync-skill.md](.opencode/prompts/sync-skill.md) — Cross-project skill sync prompt (compare & diff SKILL.md between projects)

---

## Workflow

- `pnpm install` — install everything
- `pnpm dev:backend` / `pnpm dev:web` / `pnpm dev:infra` — run the pieces
- `pnpm -r build` — build all packages
- `pnpm -r typecheck` — TypeScript across all packages
- `pnpm -r lint` — lint across all packages
- `pnpm prisma:migrate` / `pnpm prisma:studio` / `pnpm prisma:generate` — Prisma ops
- `pnpm clean` — wipe `node_modules/` and build outputs

Per package, all of the above are mirrored as `pnpm --filter <pkg> <script>`.

---

## License

TBD.
