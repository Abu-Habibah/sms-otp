# Prompt: Fix Backend E2E Test Issues

## Task

Fix remaining backend/DB issues causing e2e test failures after email uniqueness fix.

## Current Status

- 10/34 tests passing (email uniqueness fix works)
- 24 tests failing due to backend/DB issues

---

## Issue 1: FK Constraint on claim_codes_workspaceId_fkey

**Error:** `Foreign key constraint violated: claim_codes_workspaceId_fkey`

**Test Files:** `backend/test/devices-claim-codes.e2e-spec.ts`

**Root Cause:** Claim codes are created in tests without providing a valid `workspaceId`.

**Fix:**

1. In test setup, create a default workspace for the test tenant
2. Pass `workspaceId` when generating claim codes
3. Or update the claim code creation to use the test tenant's default workspace

**Implementation:**

```typescript
// In beforeEach or beforeAll
const workspace = await raw.workspace.create({
  data: {
    tenantId: tenant.id,
    name: 'Default',
    slug: 'default',
    retentionDays: 90,
  }
});

// When generating claim codes
await request(app.getHttpServer())
  .post('/v1/claim-codes')
  .set('Cookie', cookie)
  .send({ ttlMinutes: 15, workspaceId: workspace.id })
```

---

## Issue 2: 400 on POST /v1/keywords

**Error:** `400 Bad Request` when creating keywords

**Test Files:** `backend/test/keywords.e2e-spec.ts`, `backend/test/sms-ingest.e2e-spec.ts`

**Root Cause:** Keywords now require `workspaceId` in the request body.

**Fix:**

```typescript
// When creating keywords in tests
await request(app.getHttpServer())
  .post('/v1/keywords')
  .set('Cookie', cookie)
  .send({ word: 'OTP', matchMode: 'CONTAINS', workspaceId: workspace.id })
```

---

## Issue 3: Tenant Slug Derived from Email Domain

**Error:** Tests expect slug from request, but signup now auto-generates from email domain

**Test File:** `backend/test/auth-tenants.e2e-spec.ts`

**Affected Tests:** AC-3, AC-6

**Root Cause:** Tests were written for old signup flow where slug was provided in request. New flow generates slug from email domain.

**Fix:**

Update tests to expect slug from email domain:

```typescript
// AC-3: Login test
// Before: expects slug from request
// After: slug is derived from email

const email = `bob-${testSlug}@test.com`;
const expectedSlug = 'bob'; // derived from email domain part before @

// The login should work with the slug derived from the email
```

**Alternative:** Remove slug from login tests since it's now auto-derived.

---

## Issue 4: Rate Limiting Cascade

**Error:** `429 Too Many Requests` during test runs

**Test Files:** `backend/test/keywords.e2e-spec.ts` (AC-9, AC-10)

**Root Cause:** Tests hit the 10/60s rate limit when creating multiple keywords.

**Fix:**

Option A: Increase rate limit for test environment
```typescript
// In main.ts or app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: process.env.NODE_ENV === 'test' ? 100 : 10,
}])
```

Option B: Add delay between test operations
```typescript
await new Promise(resolve => setTimeout(resolve, 100));
```

Option C: Reset rate limit between tests (if using in-memory store)

---

## Implementation Checklist

- [ ] Fix claim_codes FK constraint (workspaceId)
- [ ] Fix keywords 400 error (workspaceId required)
- [ ] Fix auth tenant slug tests (derive from email)
- [ ] Fix rate limiting cascade
- [ ] Run all tests: `pnpm exec jest --config test/jest-e2e.json --runInBand`
- [ ] Verify: All 34 tests pass

---

## Reference

- Sprint doc: `docs/sprints/v2.0/sprint-1-auth-tenants.md`
- Feature spec: `docs/features/auth.md`
- Feature spec: `docs/features/claim-codes.md`
- Feature spec: `docs/features/keyword-configuration.md`
