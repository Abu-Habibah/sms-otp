# Test Plan

This document is the top-level test strategy for SMS Monitor v2.0. Per project-rules, every new feature/flow gets a QA/test-scenarios section in its feature doc; this file is the umbrella for cross-cutting test infrastructure.

---

## Test pyramid

| Level | Tooling | What we test | Where it lives |
|---|---|---|---|
| **Unit** | Jest | Pure functions, schema validation, business logic | `**/*.spec.ts` colocated with source |
| **Integration** | Jest + Supertest | Endpoints with a real NestJS test app and an ephemeral Postgres | `backend/test/*.e2e-spec.ts` |
| **Component (web)** | Vitest + Testing Library | React components in isolation | `web/**/*.test.tsx` |
| **Contract** | Zod schemas in `packages/shared-types` | Request/response shapes match across backend ↔ web | shared test suite |
| **E2E** | Playwright (planned) | Full browser flow against a running web + backend | `e2e/` (added Sprint 2+) |
| **Unit (Android)** | JUnit + MockK | Business logic, services, repositories | `app/src/test/**/*.kt` |
| **Integration (Android)** | AndroidX Test + Room | Database operations, WorkManager | `app/src/androidTest/**/*.kt` |
| **UI (Android)** | Espresso / Compose Testing | Critical user flows | `app/src/androidTest/**/*.kt` |
| **Manual smoke** | Real device (Oppo A15) | Real SMS → backend → tenant downstream | `docs/runbooks/smoke-test.md` |

---

## Coverage targets (Sprint 1+)

| Component | Target |
|---|---|
| `packages/shared-types` (Zod schemas) | 100% — every export tested |
| `backend/src/auth/**` | 90% — every auth path has at least one happy + one error case |
| `backend/src/devices/**` | 85% — claim flow happy + 3 error cases (bad code, expired, reused) |
| `web/components/ui/**` | 80% — render + interaction (Storybook-style) |
| `web/app/(auth)/**` | 80% — login + logout + expired-session |
| `app/ domain/service/**` | 90% — KeywordService, SmsHttpSender, ForwardingService |
| `app/ data/repository/**` | 85% — KeywordRepository, ForwardingRepository, SettingsRepository |
| `app/ data/local/dao/**` | 85% — Room DAO operations |

Coverage is enforced in CI via `pnpm --filter <pkg> test:coverage`. The thresholds live in each package's `jest.config.ts` / `vitest.config.ts`.

### Android Test Targets

| Component | Tool | Target | Test Cases |
|-----------|------|--------|------------|
| `KeywordService` | JUnit + MockK | 90% | Match modes, validation, CRUD |
| `SmsHttpSender` | JUnit + MockK | 85% | Request formatting, error handling |
| `ForwardingRepository` | JUnit + MockK | 85% | Upsert, prune, pending operations |
| `KeywordRepository` | JUnit + MockK | 85% | CRUD, flow emissions |
| `SettingsRepository` | JUnit + MockK | 80% | Persistence, defaults |
| Room DAOs | AndroidX Test | 85% | CRUD operations, migrations |
| WorkManager | AndroidX Test | 80% | Enqueue, constraints, retry |
| UI Screens | Espresso/Compose | 70% | Critical flows |

See [Android Enhancements](../features/android-enhancements.md) for detailed test scenarios.

---

## CI gates

Every push runs:

1. `pnpm install` — verify reproducible install
2. `pnpm typecheck` — no `any`, no `@ts-ignore` (per `docs/architecture/build-toolchain.md` convention)
3. `pnpm lint` — ESLint + Prettier
4. `pnpm test` — unit + integration
5. `pnpm build` — must produce `dist/` for backend, `.next/` for web

A PR cannot merge with a red gate.

---

## Data fixtures

Test data lives in:
- `backend/prisma/seed.ts` — idempotent seed for local dev and integration tests
- `backend/test/fixtures/` — JSON fixtures for HTTP-level tests
- `packages/shared-types/__fixtures__/` — Zod-valid example payloads referenced by both backend and web tests

---

## Manual smoke test

Before tagging a release, run the manual smoke test in [`../runbooks/smoke-test.md`](../runbooks/smoke-test.md). It exercises the full path: real SMS on a real device → backend → tenant downstream.

---

## Test plans per feature

Each feature doc under `docs/features/` includes its own QA/test-scenarios block (Gherkin-style, per project-rules Rule 2).

---

## Status

- Sprint 0: no tests yet (skeleton only) — coverage gates are **planned** for Sprint 1
- Sprint 1+: tests required before a feature is considered done
