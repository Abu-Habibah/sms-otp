# Prompt: Fix E2E Test Email Uniqueness

## Task

Fix e2e test failures caused by duplicate email addresses across test runs. The signup flow now auto-generates tenant slugs from email domains, so using the same email (e.g., `alice@test.com`) in multiple test runs creates 409 Conflict errors.

## Problem

```
Current: alice@test.com → tenant slug "test" (always same tenant)
Result: Second test run tries to create alice@test.com again → 409 Conflict
```

## Solution

Add unique suffixes to email addresses using the `testSlug` variable that's already generated in `beforeEach`.

## Files to Update

1. `backend/test/auth-tenants.e2e-spec.ts`
2. `backend/test/devices-claim-codes.e2e-spec.ts`
3. `backend/test/sms-ingest.e2e-spec.ts`
4. `backend/test/keywords.e2e-spec.ts`
5. `backend/test/clients/claim-flow.ts`

## Implementation

### Pattern

Replace all email patterns like:
```typescript
// Before
.send({ name: 'Alice', email: 'alice@test.com', password: '...' })

// After
.send({ name: 'Alice', email: `alice-${testSlug}@test.com`, password: '...' })
```

### Important Notes

1. `testSlug` is already defined in `beforeEach` in each test file
2. The email domain must remain `@test.com` for the slug auto-generation to work
3. Only change the local part (before @), not the domain
4. The `claim-flow.ts` client file uses `TENANT_SLUG` constant — update similarly

### Verification

After fixing, run:
```bash
cd backend
pnpm exec jest --config test/jest-e2e.json --runInBand
```

Expected: All 34 tests should pass.

## Reference

- Sprint doc: `docs/sprints/v2.0/sprint-1-auth-tenants.md`
- Feature spec: `docs/features/auth.md`
