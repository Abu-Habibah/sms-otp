# Task: Phase 3 — Infrastructure & Testing

**System:** be, web, test
**Priority:** High
**Estimated:** ~3 hours
**Can Run In Parallel With:** Phase 1, Phase 2, Phase 4
**Depends On:** Nothing

---

## Goal

Add missing test coverage, fix a documented bug (sort order), add pagination to SMS logs.

---

## Task 3.1 — Add E2E Tests for Untested Controllers

Three controllers have zero test coverage. Add test files for each.

### 3.1a — Users E2E Test

**New file:** `backend/test/users.e2e-spec.ts`

Cover:
- Invite user (POST /v1/users) → 201
- List users (GET /v1/users) → 200, array
- Get user (GET /v1/users/:id) → 200
- Change role (PATCH /v1/users/:id/role) → 200
- Deactivate user (DELETE /v1/users/:id) → 200
- Deactivated user cannot login → 401
- Cross-tenant access → 404
- Non-admin cannot invite → 403

**Expected:** 8 tests

### 3.1b — Workspaces E2E Test

**New file:** `backend/test/workspaces.e2e-spec.ts`

Cover:
- Create workspace (POST /v1/workspaces) → 201
- List workspaces (GET /v1/workspaces) → 200
- Get workspace (GET /v1/workspaces/:id) → 200
- Update workspace (PATCH /v1/workspaces/:id) → 200
- Delete workspace (DELETE /v1/workspaces/:id) → 200
- Add member (POST /v1/workspaces/:id/members) → 201
- List members (GET /v1/workspaces/:id/members) → 200, includes user details
- Update member role (PATCH /v1/workspaces/:id/members/:userId) → 200
- Remove member (DELETE /v1/workspaces/:id/members/:userId) → 200
- Cannot remove last owner → 409
- Non-member cannot access workspace → 404
- Duplicate member → 409

**Expected:** 12 tests

### 3.1c — SMS Logs E2E Test

**New file:** `backend/test/sms-logs.e2e-spec.ts`

Cover:
- List SMS logs (GET /v1/sms-logs) → 200, array
- Empty list for new tenant → 200, []
- Logs contain expected fields (id, sender, message, matchedKeyword, status, receivedAt)

**Expected:** 3 tests

### 3.1d — Tenant Isolation Regression Test

**New file:** `backend/test/tenant-isolation.e2e-spec.ts`

Referenced in `auth.md` AC-12 but never created. Cover:
- Raw Prisma query without tenant context throws
- Device from Tenant A cannot be accessed via Tenant B's JWT
- Keyword from Tenant A not visible to Tenant B
- SMS log from Tenant A not visible to Tenant B

**Expected:** 4 tests

---

## Task 3.2 — Fix Device Sort Order

**File:** `backend/src/devices/devices.service.ts` (line 139)

**Issue:** Code uses `orderBy: { createdAt: 'desc' }` but `docs/features/devices.md` AC-9 specifies `lastSeenAt DESC NULLS LAST, createdAt ASC`.

**Fix:**
```typescript
orderBy: [
  { lastSeenAt: { sort: 'desc', nulls: 'last' } },
  { createdAt: 'asc' },
]
```

**Verification:** Create devices with different `lastSeenAt` timestamps (including null), verify list order matches spec.

---

## Task 3.3 — Add Pagination to SMS Logs

**File:** `web/app/(dashboard)/sms-logs/SmsLogsClient.tsx`

**Issue:** Current implementation fetches ALL SMS logs with no pagination — will fail at scale.

**Fix:**
1. Add pagination to the `GET /v1/sms-logs` endpoint:
   - Query params: `?page=1&limit=20`
   - Response: `{ logs: SmsLog[], total: number, page: number, limit: number }`
2. Update `SmsLogsController` to accept page/limit query params
3. Update `SmsIngestService` to use `skip`/`take` in Prisma query
4. Update `SmsLogsClient.tsx` to show page navigation (Previous/Next buttons or load more)

**Verification:** With 50+ SMS logs in DB, navigate pages. Verify total count matches.

---

## Deliverables

- [ ] `backend/test/users.e2e-spec.ts` — 8 tests passing
- [ ] `backend/test/workspaces.e2e-spec.ts` — 12 tests passing
- [ ] `backend/test/sms-logs.e2e-spec.ts` — 3 tests passing
- [ ] `backend/test/tenant-isolation.e2e-spec.ts` — 4 tests passing
- [ ] Device sort order fixed (`lastSeenAt DESC NULLS LAST`)
- [ ] SMS logs paginated (server + client)
- [ ] All existing 35 tests still pass
- [ ] Total: 62 tests passing (35 existing + 27 new)

---

## Files Changed

| File | Change |
|------|--------|
| `backend/test/users.e2e-spec.ts` | NEW |
| `backend/test/workspaces.e2e-spec.ts` | NEW |
| `backend/test/sms-logs.e2e-spec.ts` | NEW |
| `backend/test/tenant-isolation.e2e-spec.ts` | NEW |
| `backend/src/devices/devices.service.ts` | Fix sort order |
| `backend/src/sms-ingest/sms-logs.controller.ts` | Add pagination params |
| `backend/src/sms-ingest/sms-ingest.service.ts` | Add pagination support |
| `web/app/(dashboard)/sms-logs/SmsLogsClient.tsx` | Add pagination UI |
