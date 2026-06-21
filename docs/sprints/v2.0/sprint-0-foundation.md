# Sprint 0 — v2.0 Foundation

**Sprint window:** 2026-06-08 (kickoff)
**Status:** ✅ Complete (2026-06-18)
**Goal:** Stand up the v2.0 monorepo skeleton so the next sprints can drop in features without touching repo layout.

**This is a Scaffolding sprint — no user-facing features ship, but every later sprint depends on it.**

---

## Scope

| # | Deliverable | Why |
|---|---|---|
| W0-1 | Monorepo root: `package.json` (npm workspaces), `docker-compose.yml` (Postgres 16 + Redis 7), `.gitignore`, root `README.md` | Single place to install/build/test everything |
| W0-2 | `backend/` NestJS skeleton: `package.json`, `tsconfig.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts`, Prisma client wired | The new API server, ready to receive feature modules |
| W0-3 | `backend/prisma/schema.prisma` initial models: `Tenant`, `User`, `Device`, `Keyword`, `SmsLog`, plus the enums (`UserRole`, `DeviceStatus`, `SmsStatus`) | First migration lives here; later sprints add fields |
| W0-4 | `web/` Next.js 14 skeleton: App Router, TypeScript, Tailwind, shadcn/ui-style `Button` component, `app/layout.tsx`, landing `app/page.tsx` | The new admin dashboard, ready for auth + tenant pages |
| W0-5 | `packages/shared-types/` with Zod schemas for the initial models (Tenant, User, Device, Keyword, SmsLog) | Both backend and web import these — single source of truth for request/response shapes |
| W0-6 | `docs/architecture/v2.0-overview.md` with the architecture diagram and an ADR-style record of the locked-in decisions | New team members (and future-us) can onboard from one doc |
| W0-7 | `CHANGELOG.md` → `[0.1.6]` entry marking the v1.0 backup + Sprint 0 scaffold | Version trail intact |

---

## Out of Scope (deferred)

- Auth implementation (Sprint 1.1)
- Tenant CRUD (Sprint 1.1)
- Device claim flow (Sprint 1.2)
- Web login page (Sprint 1.4)
- Mobile app v2.0 changes (Sprint 1.3, per the "build backend+web first" decision)

---

## Definition of Done

- [x] `npm install` at the repo root succeeds with no errors
- [x] `docker compose up -d` brings Postgres + Redis online
- [x] `cd backend && npm run build` produces a NestJS dist/
- [x] `cd web && npm run build` produces a Next.js build
- [x] `cd packages/shared-types && npm run build` produces compiled types
- [x] `cd backend && npx prisma migrate dev` creates the initial DB
- [x] Backend `/health` returns 200 OK
- [x] Web `/` returns a styled landing page

---

## Notes for the implementer

- **Node 24.16** is what's installed; pin via `.nvmrc` for the team
- **TypeScript 5.x** everywhere — `strict: true`
- **No `any`**: per the project's existing code conventions (`app/` has zero `as any` / `@ts-ignore` per the build-toolchain doc)
- **Comments only when they explain a non-obvious public-API contract** (the comment-checker hook is strict about this — see the `forwardingService` class KDoc for the right pattern)
- **Public API gets a KDoc** explaining the why, not the what
- **Atomic commits** per W-task above; one W-task = one commit

---

## Risks

| Risk | Mitigation |
|---|---|
| pnpm not on the dev box | Use npm workspaces — same model, ships with Node |
| Docker not running | Document that backend can run against a system-installed Postgres + Redis; `docker compose` is the recommended path |
| Next.js App Router has rough edges | Pin Next 14.x; avoid `experimental_*` flags |
| Prisma migrations on a fresh DB | Use `prisma migrate dev --name init` to create the first migration; don't ship generated SQL directly |

---

## Status

- [x] W0-7: CHANGELOG 0.1.6 entry
- [x] W0-1: Monorepo root files
- [x] W0-2: Backend NestJS skeleton
- [x] W0-3: Prisma schema
- [x] W0-4: Web Next.js skeleton
- [x] W0-5: Shared types package
- [x] W0-6: v2.0 architecture doc

> **Status updated by Sisyphus audit on 2026-06-21 — all tasks verified complete in codebase.**
