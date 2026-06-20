# Feature: Tenants

**Feature ID:** F-TENANTS
**Status:** ✅ Sprint 1 — Complete
**Last Updated:** 2026-06-08
**Supersedes:** (v1.0 had no concept of tenants)

---

## Overview

### Description

A **tenant** is a customer organization (a school, a payroll company, a CRM vendor) that subscribes to SMS Monitor and configures how its SMS get forwarded. Each tenant owns users, devices, keywords, and SMS logs. Tenants are isolated from each other at the application layer via a `tenantId` on every row and a Prisma extension that auto-filters every query.

### Problem Solved

v1.0 had one install per customer — no central management, no shared backend, no per-tenant configuration. v2.0 fixes this by making "tenant" a first-class concept.

### User Story

> As a tenant owner, I want to create a tenant with a name and a unique slug, invite users to it, and configure forwarding for it, so my organization can use SMS Monitor independently of other tenants.

---

## Scope

### In Scope

- Create tenant (`POST /v1/tenants`) with `{name, slug, forwardUrl?, retentionDays?}` — the first user to sign up via this endpoint becomes the `OWNER`
- Read tenant (`GET /v1/tenants/:id`, `GET /v1/tenants/me` for the caller's own tenant)
- Update tenant (`PATCH /v1/tenants/:id`) — only `OWNER` and `ADMIN`
- Delete tenant (`DELETE /v1/tenants/:id`) — only `OWNER`, cascades everything
- List all tenants the caller belongs to (`GET /v1/tenants`) — typically just one, but supports future "user in multiple tenants"
- Slug uniqueness (case-insensitive, URL-safe)
- Slug validation: `[a-z0-9-]+`, 2-60 chars
- `forwardUrl`: optional, validated as URL, used as the per-tenant forwarding target (Sprint 2+)
- `retentionDays`: optional, default 90, range 1-3650

### Out of Scope (deferred)

- Per-tenant billing (not planned)
- Per-tenant custom domains (not planned)
- Tenant transfer of ownership (not planned)
- Tenant merge / split (not planned)
- SSO / SCIM provisioning (post-Sprint 5)
- Multi-region tenant placement (not planned)

---

## Acceptance Criteria

- [ ] **AC-1**: `POST /v1/tenants` with valid body creates a tenant and returns 201 with `{tenant}`; the caller becomes its `OWNER`
- [ ] **AC-2**: `POST /v1/tenants` with a `slug` that already exists returns 409 with field-level error
- [ ] **AC-3**: `POST /v1/tenants` with a `slug` containing uppercase / spaces / special chars returns 400 (Zod regex)
- [ ] **AC-4**: `GET /v1/tenants/me` returns the caller's tenant (always — for tenant-scoped pages)
- [ ] **AC-5**: `GET /v1/tenants/:id` returns 404 if the tenant exists but the caller is not a member
- [ ] **AC-6**: `GET /v1/tenants/:id` returns 404 if the tenant does not exist (same response — no enumeration)
- [ ] **AC-7**: `PATCH /v1/tenants/:id` by an `OWNER` or `ADMIN` updates the tenant; by a `VIEWER` returns 403
- [ ] **AC-8**: `DELETE /v1/tenants/:id` cascades to delete all users, devices, claim codes, keywords, sms_logs in a single transaction
- [ ] **AC-9**: A regression test confirms that a user from tenant A cannot read, update, or delete tenant B — even with a guessed `id`
- [ ] **AC-10**: `forwardUrl` validation: must be a valid URL with `http` or `https` scheme
- [ ] **AC-11**: `retentionDays` validation: 1-3650 inclusive, default 90

---

## Dependencies

- [x] `docs/architecture/v2.0-overview.md` — ADR-001 (shared schema + `tenantId`)
- [x] `packages/shared-types/` — Zod schemas: `Tenant`, `CreateTenantInput`
- [x] `docs/features/auth.md` — login is required before tenant operations
- [ ] `docs/sprints/v2.0/sprint-1-auth-tenants.md` — current sprint

---

## Risks

| Risk | Mitigation |
|---|---|
| Tenant enumeration via 200 vs 404 on `/v1/tenants/:id` | Return 404 in both "not found" and "not your tenant" cases |
| Slug collisions on bulk import | Zod regex + DB unique constraint + retryable 409 |
| Delete cascade accidentally removes too much | Test asserts cascade behavior in `test/tenants.e2e-spec.ts` |
| Tenant owner loses access (e.g. removed accidentally) | Per-tenant at least one OWNER invariant — but Sprint 2 will add a "promote to OWNER" flow |

---

## E2E Flow

### Flow Diagram

```
[Browser]                          [Web (Next.js)]                  [Backend]                     [Postgres]
    │                                   │                              │                            │
    │ POST /api/tenants                 │                              │                            │
    │   {name: "Acme", slug: "acme",    │                              │                            │
    │    forwardUrl: "https://...",     │                              │                            │
    │    retentionDays: 90}             │                              │                            │
    ├──────────────────────────────────▶│                              │                            │
    │                                   │ POST /v1/tenants              │                            │
    │                                   │   (Cookie: jwt=...)           │                            │
    │                                   ├─────────────────────────────▶│                            │
    │                                   │                              │ @UseGuards(JwtAuthGuard)   │
    │                                   │                              │ @Roles('OWNER')            │
    │                                   │                              │ -- seed TenantContext      │
    │                                   │                              │ BEGIN; tx {                │
    │                                   │                              │   -- generate slug if empty│
    │                                   │                              │   INSERT tenants...        │
    │                                   │                              │ } COMMIT;                  │
    │                                   │                              │ 201 { tenant }            │
    │                                   │◀─────────────────────────────┤                            │
    │   (modal closes, list refreshes)  │                              │                            │
    │◀──────────────────────────────────┤                              │                            │
```

### Step-by-Step

1. **Browser submits create-tenant form** with `{name, slug, forwardUrl?, retentionDays?}`
2. **Web calls backend** with the caller's JWT cookie
3. **Backend's JwtAuthGuard verifies the cookie**, seeds `TenantContext` with `{userId, tenantId, role}`
4. **Backend validates Zod schema** (`CreateTenantInput`)
5. **Backend checks role** — `OWNER` required (only an existing owner can create additional tenants; in practice the first user of a new tenant becomes its owner at signup time, and this endpoint is for renaming or adding a new tenant under the same user)
6. **Backend inserts tenant** in a transaction with `tenantId` set from context (defense in depth — even if the client sends a `tenantId`, the server overrides)
7. **Backend responds 201** with `{tenant}` (no internal fields)
8. **Web refreshes the tenants list**

---

## Error Handling

| Error Condition | Handling Strategy | HTTP Code |
|---|---|---|
| Invalid payload (Zod) | 400 with field-level errors | 400 |
| Slug invalid (regex) | 400 "slug must be lowercase letters, digits, and hyphens" | 400 |
| Slug already exists | 409 "slug is taken" | 409 |
| Tenant not found | 404 "Not found" | 404 |
| Not a member of this tenant | 404 "Not found" (no enumeration) | 404 |
| Insufficient role | 403 "Forbidden" | 403 |
| Delete with active devices | 409 "Revoke all devices before deleting" | 409 |
| `forwardUrl` invalid | 400 with URL parse error | 400 |

---

## QA / Test Scenarios

```gherkin
Scenario: Create tenant happy path
  Given I am logged in as an OWNER
  When I POST /v1/tenants with {name: "Acme", slug: "acme"}
  Then the response is 201 with a tenant object
  And a new row exists in the tenants table

Scenario: Slug collision
  Given a tenant with slug "acme" already exists
  When I POST /v1/tenants with slug "acme"
  Then the response is 409 "slug is taken"

Scenario: Slug with uppercase
  When I POST /v1/tenants with slug "Acme"
  Then the response is 400 (Zod regex)

Scenario: Cross-tenant read
  Given I belong to tenant A only
  When I GET /v1/tenants/<tenant-B-id>
  Then the response is 404 (not 403 — no enumeration)

Scenario: Cross-tenant write
  Given I belong to tenant A only
  When I PATCH /v1/tenants/<tenant-B-id> with {name: "Hacked"}
  Then the response is 404

Scenario: Delete cascades
  Given I am an OWNER of tenant T with 3 users, 2 devices, 5 keywords, 10 sms_logs
  When I DELETE /v1/tenants/T.id
  Then the response is 204
  And tenants T, its users, devices, claim_codes, keywords, sms_logs are all gone

Scenario: VIEWER cannot update
  Given I am a VIEWER
  When I PATCH /v1/tenants/<my-tenant>
  Then the response is 403
```

---

## Status

- 🔲 Sprint 1 implementation (in progress)
- 📅 Sprint 2: owner can promote another user to OWNER (if there's currently only one)
- 📅 Post-Sprint 5: SCIM provisioning

## Related

- [`docs/features/auth.md`](./auth.md) — login required for tenant ops
- [`docs/architecture/v2.0-overview.md`](../architecture/v2.0-overview.md) — ADR-001, ADR-002
- [`docs/sprints/v2.0/sprint-1-auth-tenants.md`](../sprints/v2.0/sprint-1-auth-tenants.md) — sprint plan
