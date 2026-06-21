# Sprint 8 — API Completion & Cleanup

**Sprint window:** 2026-06-11 → 2026-06-11
**Status:** ✅ Complete
**Owner:** jokos
**Goal:** Complete the documented API surface, clean up dead dependencies, and fix QR code URL configuration.

---

## Scope (in)

| # | Deliverable | Layer |
|---|---|---|
| 1 | Add `DELETE /v1/claim-codes/:id` endpoint (cancel unused claim codes) | backend |
| 2 | Remove dead Retrofit dependency from Android build config | android |
| 3 | Add `publicApiUrl` field to Tenant model for QR code URL configuration | backend + web |
| 4 | Sync keywords after successful heartbeat | android |

## Scope (out — future sprints)

- Multi-tenant user switching (v3+)
- Password reset flow (Sprint 2 carryover)
- Web /tenants and /users pages (Sprint 2 carryover)

---

## Definition of Done

- [x] `pnpm --filter @sms-monitor/backend typecheck` — 0 errors
- [x] `pnpm --filter @sms-monitor/backend build` — clean
- [x] `pnpm --filter @sms-monitor/backend test:e2e` — all tests pass (including new claim-code cancel test)
- [x] Android app builds without Retrofit dependency
- [x] `docs/features/claim-codes.md` AC-10 marked as implemented
- [x] `CHANGELOG.md` has `[0.7.0]` entry

---

## Task 1: DELETE /v1/claim-codes/:id

### Background

Documented in `docs/features/claim-codes.md` AC-10:

> An OWNER/ADMIN can cancel an unused claim code via `DELETE /v1/claim-codes/:id` (sets `expiresAt = now()`). Used codes cannot be cancelled (409 Conflict).

This endpoint was planned in Sprint 2 but not implemented. It's the only missing endpoint from the documented API surface.

### Requirements

1. **Endpoint**: `DELETE /v1/claim-codes/:id`
2. **Auth**: JWT required, `@Roles('OWNER', 'ADMIN')`
3. **Behavior**:
   - Find claim code by ID
   - Verify it belongs to the current tenant (404 if not)
   - If code is already used (`usedAt != null`), return 409 Conflict
   - Set `expiresAt = now()` to cancel the code
   - Return 204 No Content on success
4. **Error responses**:
   - 404: Code not found or belongs to different tenant
   - 409: Code already used
   - 403: User lacks OWNER/ADMIN role

### Implementation Plan

1. Add `cancel(id: string)` method to `ClaimCodesService`
2. Add `DELETE /v1/claim-codes/:id` endpoint to `ClaimCodesController`
3. Add e2e test for cancel flow (happy path + 409 on used code)
4. Update `docs/features/claim-codes.md` to mark AC-10 as implemented

### Files to Modify

- `backend/src/claim-codes/claim-codes.service.ts` — Add `cancel()` method
- `backend/src/claim-codes/claim-codes.controller.ts` — Add DELETE endpoint
- `backend/test/claim-codes.e2e-spec.ts` — Add cancel test cases
- `docs/features/claim-codes.md` — Mark AC-10 as ✅

---

## Task 2: Remove Dead Retrofit Dependency

### Background

The Android `app/build.gradle.kts` declares Retrofit 2.9.0 and its Gson converter, but the app uses raw OkHttp for all HTTP calls. This is dead weight that adds ~200KB to the APK.

### Requirements

1. Search `app/src/` for any `import retrofit2` statements
2. If no imports found, remove from `build.gradle.kts`:
   - `implementation("com.squareup.retrofit2:retrofit:2.9.0")`
   - `implementation("com.squareup.retrofit2:converter-gson:2.9.0")`
3. Build the app to verify no compilation errors
4. Document the cleanup in CHANGELOG

### Files to Modify

- `app/build.gradle.kts` — Remove Retrofit dependencies

### Safety Check

Before removing, grep for `import retrofit2` in `app/src/`. If any file uses Retrofit, do NOT remove — report instead.

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP8-T1 | ClaimCode cancel method | Add `cancel()` to `ClaimCodesService` | 0.5h | P0 | ✅ |
| F-SP8-T2 | DELETE endpoint | Add `DELETE /v1/claim-codes/:id` to controller | 0.5h | P0 | ✅ |
| F-SP8-T3 | E2e test for cancel | Test happy path + 409 on used code + 404 cross-tenant | 0.5h | P0 | ✅ |
| F-SP8-T4 | Retrofit safety check | Grep for `import retrofit2` in app/src | 0.1h | P0 | ✅ |
| F-SP8-T5 | Remove Retrofit deps | Remove from build.gradle.kts if safe | 0.1h | P0 | ✅ |
| F-SP8-T6 | Build verification | `pnpm -r typecheck` + `pnpm -r build` | 0.2h | P0 | ✅ |
| F-SP8-T7 | Docs update | Update claim-codes.md, CHANGELOG, README | 0.3h | P1 | ✅ |
| F-SP8-T8 | Prisma migration | Add `publicApiUrl` field to Tenant model | 0.3h | P0 | ✅ |
| F-SP8-T9 | Tenant API update | Expose `publicApiUrl` in GET/PATCH endpoints | 0.5h | P0 | ✅ |
| F-SP8-T10 | Web Settings UI | Add "Public API URL" input field to tenant settings | 1h | P0 | ✅ |
| F-SP8-T11 | QR code fix | Use `tenant.publicApiUrl` with fallback chain | 0.5h | P0 | ✅ |
| F-SP8-T12 | E2e test for public URL | Test auto-detect, override, QR generation | 0.5h | P1 | ✅ |
| F-SP8-T13 | Rebuild Docker containers | Rebuild web container with new env var support | 0.2h | P0 | ✅ |
| F-SP8-T14 | Heartbeat keyword sync | Inject KeywordSyncService, sync after successful heartbeat | 0.5h | P0 | ✅ |
| F-SP8-T15 | Sync throttling | Throttle keyword sync to max once per 5 minutes | 0.3h | P0 | ✅ |

**Sprint 8 total: ~5.5h** of focused work.

---

## Task 3: Tenant Public URL Configuration

### Background

QR codes currently use the internal Docker address (`http://be:6001`) or the web admin's origin, which physical Android devices cannot reach. This task adds a configurable `publicApiUrl` field to each tenant, allowing admins to set the correct external URL for QR codes.

### Requirements

1. **Database**: Add `publicApiUrl String?` to Tenant model
2. **API**: Expose in `GET /v1/tenants/me` and `PATCH /v1/tenants/:id`
3. **UI**: Add "Public API URL" input in tenant settings page
4. **Auto-detection**: Pre-fill with `NEXT_PUBLIC_PUBLIC_API_URL` env or `window.location.origin`
5. **QR generation**: Use `tenant.publicApiUrl` with fallback chain

### Auto-Detection Logic

```typescript
function detectPublicApiUrl(): string {
  // 1. Environment variable (set in Docker/build)
  if (process.env.NEXT_PUBLIC_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_PUBLIC_API_URL;
  }
  // 2. Web admin's origin (works for local dev)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // 3. Ultimate fallback
  return 'http://localhost:6001';
}
```

### Files to Modify

- `backend/prisma/schema.prisma` — Add `publicApiUrl` field
- `backend/src/tenants/tenants.service.ts` — Expose in find/update
- `backend/src/tenants/tenants.controller.ts` — Accept in PATCH
- `web/app/(dashboard)/tenants/TenantsClient.tsx` — Add input field
- `web/app/(dashboard)/devices/DevicesClient.tsx` — Read from tenant config
- `web/app/(dashboard)/devices/page.tsx` — Fetch tenant data
- `docker-compose.yml` — Add `NEXT_PUBLIC_PUBLIC_API_URL` build arg
- `docker/services/web/Dockerfile` — Accept build arg

### Acceptance Criteria

- [x] AC-1: Tenant model has `publicApiUrl String?` field
- [x] AC-2: `GET /v1/tenants/me` returns `publicApiUrl` (null if not set)
- [x] AC-3: `PATCH /v1/tenants/:id` accepts `publicApiUrl` field
- [x] AC-4: Web Settings page shows "Public API URL" input
- [x] AC-5: Input pre-filled with auto-detected value when null
- [x] AC-6: QR code uses `tenant.publicApiUrl` when set
- [x] AC-7: QR code falls back to `window.location.origin` when not set
- [x] AC-8: Value persists to DB on save

### Documentation

- Feature doc: `docs/features/tenant-public-url.md`

---

## Task 4: Keyword Sync After Heartbeat

### Background

Keywords currently only sync once on app launch. If an admin adds/removes keywords while the app is running, devices won't pick up changes until restart. This task adds keyword sync after each successful heartbeat (every 60 seconds, throttled to once per 5 minutes).

### Requirements

1. **Trigger**: Sync keywords after successful heartbeat (HTTP 200)
2. **Throttle**: Max once per 5 minutes (ignore if last sync < 5 min ago)
3. **Error handling**: Failed heartbeat does NOT trigger sync; failed sync does NOT affect heartbeat
4. **Auth**: Use existing HMAC authentication (KeywordSyncService)
5. **Logging**: Log sync results (success count or error)

### Implementation Plan

1. Inject `KeywordSyncService` into `HeartbeatService`
2. Add `syncKeywordsIfNeeded()` method with throttling
3. Call after successful heartbeat response
4. Use `settingsRepository.lastKeywordSyncTime` for throttle tracking

### Files to Modify

- `app/src/main/java/com/smsmonitor/app/service/HeartbeatService.kt` — Inject service, add sync logic
- `app/src/main/java/com/smsmonitor/data/repository/SettingsRepository.kt` — Verify `lastKeywordSyncTime` is accessible

### Acceptance Criteria

- [x] AC-1: Keywords sync after successful heartbeat
- [x] AC-2: Sync throttled to max once per 5 minutes
- [x] AC-3: Failed heartbeat does NOT trigger sync
- [x] AC-4: Failed sync does NOT affect heartbeat status
- [x] AC-5: Sync uses HMAC authentication
- [x] AC-6: Sync results logged

### Documentation

- Feature doc: `docs/features/keyword-sync-heartbeat.md`

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Claim code cancel breaks existing e2e tests | Low | New endpoint only; existing tests don't use cancel |
| Retrofit is used somewhere we missed | Very Low | Grep check before removal; build verification |
| Cancel endpoint used for attack (cancel others' codes) | Low | Tenant isolation check returns 404 |
| Public URL misconfigured causes claim failure | Medium | Auto-detect provides sensible default; admin can override |
| Prisma migration fails on existing data | Low | Field is nullable; no data migration needed |

---

## Status

_Starting after Sprint 7 completion._
