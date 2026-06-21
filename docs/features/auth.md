# Feature: Auth

**Feature ID:** F-AUTH
**Status:** ✅ Sprint 1 — Complete
**Last Updated:** 2026-06-13
**Supersedes:** (v1.0 had no real auth — auto-generated UUID in SharedPreferences)

---

## Overview

### Description

Admin signs up with `(name, email, password)`, receives a JWT in an httpOnly cookie. Tenant slug is auto-generated from the email domain. Admin can then invite/add users to the tenant. Every authenticated request carries the JWT; the backend verifies it, seeds an `AsyncLocalStorage`-backed tenant context, and the Prisma client auto-filters every query by `tenantId`.

### Problem Solved

- v1.0 has no concept of users or tenants — every install is its own island.
- v2.0 needs humans to administer tenants via the web, and devices to authenticate to the backend (Sprint 2).

### User Story

> As a tenant admin, I want to sign up, log in, and see a tenant-scoped dashboard, so I can manage my SMS forwarding configuration.

---

## Scope

### In Scope

- Email + password signup (tenant slug auto-generated from email domain)
- Login (sets httpOnly JWT cookie)
- Logout (clears cookie)
- Refresh (silent rotation, 7-day sliding window)
- Forgot-password flow (token in email, 1-hour TTL) — implemented in Sprint 2
- Email verification — Sprint 2
- Role-based access control: `OWNER` > `ADMIN` > `VIEWER`
- User invite/add from tenant settings (admin adds users with email, name, role, temp password)

### Out of Scope (deferred)

- 2FA / TOTP (post-Sprint 5)
- OAuth / SSO (not planned)
- API key auth for users (tenant admin uses cookie auth; device API keys are separate — see Devices feature in Sprint 2)
- Password-less / magic link (not planned)

---

## Acceptance Criteria

- [ ] **AC-1**: A user can POST `/v1/auth/signup` with `{name, email, password}` and receive 201 with `{user, tenant}` plus a `Set-Cookie: jwt=...` header. Tenant slug is auto-generated from email domain.
- [ ] **AC-2**: A user can POST `/v1/auth/login` with `{tenantSlug, email, password}` and receive 200 with `{user, tenant}` plus a new `Set-Cookie: jwt=...` header
- [ ] **AC-3**: An authenticated request to any protected endpoint (`GET /v1/me`, `GET /v1/tenants`, etc.) returns 200 with the user's tenant-scoped data
- [ ] **AC-4**: An unauthenticated request to a protected endpoint returns 401
- [ ] **AC-5**: A request with a JWT issued for tenant A trying to access tenant B's data returns 403 (or 404 to avoid leaking existence)
- [ ] **AC-6**: Passwords are stored as bcrypt hashes (cost 12) — never plaintext
- [ ] **AC-7**: JWT is HS256 (Sprint 1), signed with `JWT_SECRET` from env, contains `{userId, tenantId, role}`, expires in 15 minutes
- [ ] **AC-8**: Refresh token (separate, longer-lived, httpOnly cookie) can exchange for a new JWT without re-entering credentials
- [ ] **AC-9**: Logout clears both cookies and revokes the refresh token in the DB
- [ ] **AC-10**: Login is rate-limited to 10 attempts per 15 minutes per IP (via `@nestjs/throttler`)
- [ ] **AC-11**: An attacker who knows a user's email but not the tenant slug cannot brute-force the password (the lookup is `WHERE tenantId = ? AND email = ?`)
- [ ] **AC-12**: A regression test asserts that any Prisma call missing `tenantId` (in where) fails — see `test/tenant-isolation.e2e-spec.ts`

---

## Dependencies

- [x] `docs/architecture/v2.0-overview.md` — ADR-005 (multi-tenancy)
- [ ] `docs/sprints/v2.0/sprint-1-auth-tenants.md` — current sprint doc
- [x] `packages/shared-types/` — Zod schemas: `LoginInput`, `AuthTokens`, `User`, `Tenant`, `CreateTenantInput`, `CreateUserInput`

---

## Risks

| Risk | Mitigation |
|---|---|
| JWT secret leak → attacker can mint tokens for any tenant | Use a strong, random secret (32+ bytes); rotate via env var; document rotation in runbook |
| Cross-tenant data leak via raw `prisma.*` query | Prisma `$extends` injects `where: { tenantId }`; regression test scans for `findMany`/`findFirst` calls that bypass the extension |
| Brute-force on login endpoint | `@nestjs/throttler` 10/15min/IP; account lockout after 5 failed attempts in 15 min (Sprint 2) |
| Password stored in JWT (we don't, but...) | Only `userId, tenantId, role` go in the JWT; no PII |
| CSRF on cookie-based auth | SameSite=Strict cookie attribute; web uses Auth.js which handles this |

---

## E2E Flow

### Flow Diagram

```
[Browser]                              [Web (Next.js)]                [Backend (NestJS)]              [Postgres]
    │                                       │                              │                            │
    │ POST /api/auth/signup                  │                              │                            │
    │   {tenantSlug, name, email, password}  │                              │                            │
    ├──────────────────────────────────────▶│                              │                            │
    │                                       │ POST /v1/auth/signup          │                            │
    │                                       ├─────────────────────────────▶│                            │
    │                                       │                              │ BEGIN; tx {               │
    │                                       │                              │   -- resolve tenant       │
    │                                       │                              │   SELECT tenants           │
    │                                       │                              │     WHERE slug = :slug     │
    │                                       │                              │   IF not found → 404       │
    │                                       │                              │   -- create user           │
    │                                       │                              │   bcrypt(:password, 12)    │
    │                                       │                              │   INSERT users             │
    │                                       │                              │     (tenantId, role=OWNER) │
    │                                       │                              │ COMMIT;                    │
    │                                       │                              │ signJWT({userId,           │
    │                                       │                              │          tenantId,         │
    │                                       │                              │          role})            │
    │                                       │                              │ Set-Cookie: jwt=...;       │
    │                                       │                              │   HttpOnly; Secure;        │
    │                                       │                              │   SameSite=Strict           │
    │                                       │                              │ 201 { user, tenant }      │
    │                                       │◀─────────────────────────────┤                            │
    │ 302 → /dashboard                      │                              │                            │
    │◀──────────────────────────────────────┤                              │                            │
```

### Step-by-Step

1. **Browser submits signup form** — `POST /api/auth/signup` with `{tenantSlug, name, email, password}`
2. **Web proxies to backend** — `POST /v1/auth/signup`
3. **Backend validates Zod schema** — `CreateUserInput` (from `packages/shared-types`)
4. **Backend looks up tenant** — `prisma.tenant.findUnique({ where: { slug } })`. If not found → 404
5. **Backend bcrypts password** — `bcrypt.hash(password, 12)`
6. **Backend creates user** — `prisma.user.create({ data: { tenantId, name, email, passwordHash, role: 'OWNER' } })` in a transaction
7. **Backend issues JWT** — `sign({ sub: userId, tenantId, role })` with `JWT_SECRET`, 15-min TTL
8. **Backend sets httpOnly cookie** — `Set-Cookie: jwt=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`
9. **Backend responds 201** with `{ user, tenant }` (no passwordHash)
10. **Web stores the response** and redirects to `/dashboard`

---

## Error Handling

| Error Condition | Handling Strategy | HTTP Code |
|---|---|---|
| Invalid signup payload | Zod validation error → 400 with field-level messages | 400 |
| Tenant slug not found | "Tenant not found" (no enumeration) | 404 |
| Email already exists in this tenant | "Email already in use" | 409 |
| Wrong password | Generic "Invalid credentials" (no enumeration) | 401 |
| Rate limit exceeded | "Too many requests, try again later" | 429 |
| JWT expired | Frontend intercepts 401, calls /v1/auth/refresh; if refresh fails, redirect to /login | 401 |
| Refresh token revoked (logout) | "Session expired" | 401 |
| Cross-tenant JWT (issued for A, used on B's request) | "Forbidden" | 403 |

---

## QA / Test Scenarios

```gherkin
Scenario: Successful signup
  Given the tenant "acme" does not exist
  When I POST /v1/auth/signup with {tenantSlug: "acme", name: "Alice", email: "alice@acme.com", password: "Strong1Pass!"}
  Then the response is 201 with {user: {email: "alice@acme.com", role: "OWNER"}, tenant: {slug: "acme"}}
  And the Set-Cookie header has a JWT cookie

Scenario: Signup with duplicate email in same tenant
  Given the tenant "acme" exists with a user "alice@acme.com"
  When I POST /v1/auth/signup with the same email
  Then the response is 409 "Email already in use"

Scenario: Signup with non-existent tenant slug
  Given no tenant with slug "nope"
  When I POST /v1/auth/signup with tenantSlug "nope"
  Then the response is 404 "Tenant not found"

Scenario: Login with wrong password
  Given the tenant "acme" has user "alice@acme.com" with password "right"
  When I POST /v1/auth/login with password "wrong"
  Then the response is 401 "Invalid credentials"

Scenario: Cross-tenant access
  Given I am logged in as user in tenant A
  When I GET /v1/tenants with my JWT
  Then I only see tenant A's data, never tenant B's

Scenario: Rate limit on login
  Given I make 11 failed login attempts in 15 minutes from the same IP
  When I make the 12th attempt
  Then the response is 429 "Too many requests"

Scenario: Logout clears cookies
  Given I am logged in
  When I POST /v1/auth/logout
  Then the JWT cookie is cleared (Max-Age=0)
  And subsequent authenticated requests return 401

Scenario: Refresh works
  Given I am logged in with a valid refresh token
  When I POST /v1/auth/refresh
  Then the response is 200 with a new JWT cookie
  And the old refresh token is revoked
```

---

## Status

- ✅ Sprint 1 implementation (complete)
- ✅ Sprint 2: forgot-password + email verification (implemented)

## Related

- [`docs/features/tenants.md`](./tenants.md) — sibling feature in Sprint 1
- [`docs/architecture/v2.0-overview.md`](../architecture/v2.0-overview.md) — ADR-001, ADR-005
- [`docs/sprints/v2.0/sprint-1-auth-tenants.md`](../sprints/v2.0/sprint-1-auth-tenants.md) — sprint plan
- [`docs/runbooks/02-smoke-test.md`](../runbooks/02-smoke-test.md) — manual E2E smoke
