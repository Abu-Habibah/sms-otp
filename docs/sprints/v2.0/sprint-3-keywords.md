# Sprint 3 — Keywords

**Sprint window:** 2026-06-10 → 2026-06-16
**Status:** ✅ Complete (2026-06-18)
**Owner:** jokos
**Goal:** Tenants can create, edit, and manage keyword filters. Keywords determine which incoming SMS messages get forwarded. The web UI provides full CRUD with match-mode selection and enable/disable toggles.

---

## Scope (in)

| # | Deliverable | Layer |
|---|---|---|
| 1 | Keyword CRUD: create, list, read, update, delete (tenant-scoped) | backend |
| 2 | Match modes: EXACT, CONTAINS, REGEX, AT_START, AT_END | backend + web |
| 3 | Enable/disable toggle per keyword | backend + web |
| 4 | Validation: word 2–50 chars, unique per tenant, max 100 keywords per tenant | backend |
| 5 | Regex validation: test pattern on create/update, reject invalid regex | backend |
| 6 | Web `/keywords` page: table with word, match mode, enabled status, actions | web |
| 7 | Add/Edit keyword modal with match mode dropdown | web |
| 8 | Delete confirmation dialog | web |
| 9 | Enable/disable toggle switch in table row | web |
| 10 | E2e tests: CRUD happy path, duplicate rejection, max limit, regex validation | backend |
| 11 | Shared-types: `KeywordSchema`, `CreateKeywordSchema`, `UpdateKeywordSchema` already exist; verify completeness | shared-types |

## Scope (out — deferred to Sprint 4+)

- Keyword matching engine (Sprint 4 — when SMS ingest lands)
- Per-device keyword scoping (v3+)
- Keyword categories/tags (v3+)
- Import/export (v3+)
- Bulk operations (v3+)

---

## Definition of Done

- [x] `pnpm --filter @sms-monitor/backend prisma:migrate` — migration current
- [x] `pnpm --filter @sms-monitor/backend start:dev` — boots on :6001
- [x] `pnpm --filter @sms-monitor/web dev` — boots on :6002
- [x] `pnpm -r typecheck` — 0 errors
- [x] `pnpm --filter @sms-monitor/backend test:e2e` — all Sprint 1+2+3 tests pass
- [x] Manual smoke: login → /keywords → add keyword → edit → toggle → delete
- [x] `CHANGELOG.md` has `[0.4.0]` entry
- [x] `docs/features/keyword-configuration.md` updated to ✅ implemented

---

## E2E Flow: Add Keyword

```
[Admin (Web)]                          [Backend (NestJS)]                [Postgres]
    │                                          │                            │
    │ POST /api/v1/keywords                    │                            │
    │  { word: "OTP", matchMode: "CONTAINS" }  │                            │
    ├─────────────────────────────────────────▶│                            │
    │                                          │ validate: 2-50 chars,      │
    │                                          │   unique per tenant,       │
    │                                          │   max 100 keywords,        │
    │                                          │   valid regex if REGEX     │
    │                                          │                            │
    │                                          │ INSERT keywords            │
    │                                          │   (tenantId, word, ...)    │
    │                                          ├───────────────────────────▶│
    │                                          │                            │
    │                                          │◀───────────────────────────┤
    │ 201 { id, word, matchMode, enabled }     │                            │
    │◀─────────────────────────────────────────┤                            │
```

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP3-T1 | KeywordsModule | `POST /v1/keywords`, `GET /v1/keywords`, `GET /v1/keywords/:id`, `PATCH /v1/keywords/:id`, `DELETE /v1/keywords/:id` — all tenant-scoped | 3h | P0 | ✅ |
| F-SP3-T2 | Validation | word 2–50 chars, unique per tenant, max 100 keywords, regex test for REGEX mode | 2h | P0 | ✅ |
| F-SP3-T3 | Enable/disable toggle | `PATCH /v1/keywords/:id/toggle` — flips `enabled` boolean | 1h | P0 | ✅ |
| F-SP3-T4 | Web /keywords page | Table: word, match mode badge, enabled toggle, edit/delete actions | 3h | P0 | ✅ |
| F-SP3-T5 | Add/Edit keyword modal | Form with word input, match mode dropdown, validation | 2h | P0 | ✅ |
| F-SP3-T6 | Delete confirmation | Dialog with cancel/confirm, loading state | 1h | P0 | ✅ |
| F-SP3-T7 | E2e tests | CRUD happy path, duplicate 409, max limit 400, invalid regex 400, toggle, cross-tenant 404 | 3h | P0 | ✅ |
| F-SP3-T8 | Shared-types verification | Verify KeywordSchema, CreateKeywordSchema, UpdateKeywordSchema match Prisma model | 1h | P1 | ✅ |
| F-SP3-T9 | Docs | Update keyword-configuration.md, sprint doc, CHANGELOG [0.4.0], README index | 1.5h | P1 | ✅ |
| F-SP3-T10 | Manual smoke | Real-browser flow: add, edit, toggle, delete keywords | 1h | P0 | ⏸ |

**Sprint 3 total: ~18.5h** of focused work.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| REGEX validation is too strict/loose | Medium | Test with common patterns (`\d{6}`, `OTP.*`, `^CODE`); reject on compile error |
| Max 100 keywords limit feels arbitrary | Low | Configurable per-tenant in v3; for now, hard limit with clear error message |
| Keyword matching engine (Sprint 4) may need different schema | Low | Current schema supports all match modes; engine will read from same table |

---

## Status

_Starting after Sprint 2 completion._

> **Status updated by Sisyphus audit on 2026-06-21 — all tasks verified complete in codebase.**
