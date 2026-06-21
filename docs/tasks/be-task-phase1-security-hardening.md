# Task: Phase 1 — Security Hardening

**System:** be
**Priority:** Critical
**Estimated:** ~4 hours
**Can Run In Parallel With:** Phase 2, Phase 3, Phase 4
**Depends On:** Nothing

---

## Goal

Close the 5 most critical security gaps in the SMS Monitor backend.

---

## Task 1.1 — Integrate Zod Validation into NestJS

**File:** `backend/src/common/common.module.ts`

Add a custom Zod validation pipe and import the shared-types schemas. Instead of full class-validator overhauls, inject Zod validation at key endpoints that accept untrusted input.

**Steps:**
1. Create `backend/src/common/validation/zod-validation.pipe.ts` — A pipe that takes a Zod schema and validates `@Body()` against it
2. Apply `@UsePipes(new ZodValidationPipe(someSchema))` to:
   - `AuthController.signup()` — validate email, name, password
   - `AuthController.login()` — validate email, password
   - `ClaimCodesController.claim()` — validate code, publicKey
   - `KeywordsController.create()` — validate word, matchMode
   - `WorkspaceController.create()` — validate name
   - `DevicesController.heartbeat()` — validate deviceInfo
3. Add `whitelist: true, forbidNonWhitelisted: true` to global ValidationPipe in `main.ts`

**Verification:** Send invalid payloads to each endpoint → expect 400 with error messages (not 201/200 with garbage data or 500).

---

## Task 1.2 — Fix Refresh Token Hashing

**File:** `backend/src/auth/auth.service.ts` (lines 128-134)

Replace insecure `base64url` encoding with HMAC-SHA256.

**Steps:**
1. Replace `hashRefreshToken()` function:
   ```typescript
   import { createHmac } from 'node:crypto';
   
   const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? process.env.JWT_SECRET ?? 'dev-fallback';
   
   export function hashRefreshToken(raw: string): string {
     return createHmac('sha256', REFRESH_TOKEN_SECRET).update(raw).digest('hex');
   }
   ```
2. Add `REFRESH_TOKEN_SECRET` to `.env.example` and `docker-compose.yml`

**Verification:** Login, refresh token, verify the stored hash is not a simple base64 of the raw token. Existing tokens will be invalidated (acceptable for dev).

---

## Task 1.3 — Rotate JWT Secret

**Files:** `docker-compose.yml`, `backend/.env`, `backend/.env.example`

**Steps:**
1. Remove hardcoded `JWT_SECRET` from `docker-compose.yml` line 66
2. Update `.env.example` with a placeholder comment: `# Generate: openssl rand -hex 32`
3. Verify `.env` is in `.gitignore` and not tracked
4. Document in README that `JWT_SECRET` must be set before production deployment

**Verification:** `docker compose up -d` works with JWT_SECRET from `.env` only. Verify no hardcoded secrets in any committed file.

---

## Task 1.4 — Fix CORS Fail-Safe

**File:** `backend/src/main.ts` (lines 19-23)

**Steps:**
1. Change default from `origin: true` to `origin: false` when CORS_ORIGINS is empty:
   ```typescript
   const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) ?? [];
   app.enableCors({
     origin: corsOrigins.length > 0 ? corsOrigins : false,
     credentials: true,
   });
   ```
2. In development (NODE_ENV=development), allow `http://localhost:3001` automatically

**Verification:** Without CORS_ORIGINS set, cross-origin requests are rejected. With it set, they pass.

---

## Task 1.5 — Sanitize Health Check URL

**File:** `backend/src/health/health.controller.ts` (lines 34-58)

**Steps:**
1. Restrict `check-url` to only workspace-configured URLs:
   - Accept `workspaceId` instead of raw `url`
   - Look up workspace's `forwardUrl` or `publicApiUrl`
   - Only test those URLs (not arbitrary ones)
2. Or alternatively: restrict to URLs matching configured CORS origins / known hosts
3. Add a max redirect limit (no following redirects to internal IPs)

**Verification:** Send internal URL like `http://localhost:5432` → rejected. Send configured workspace URL → works.

---

## Deliverables

- [ ] `backend/src/common/validation/zod-validation.pipe.ts` created
- [ ] 6+ controllers with Zod validation applied
- [ ] `hashRefreshToken()` uses HMAC-SHA256
- [ ] No hardcoded JWT_SECRET in docker-compose.yml
- [ ] CORS defaults to `origin: false`
- [ ] Health check URL restricted to workspace URLs
- [ ] Backend compiles clean: `pnpm --filter @sms-monitor/backend build`
- [ ] All 35 e2e tests pass

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/common/validation/zod-validation.pipe.ts` | NEW |
| `backend/src/auth/auth.controller.ts` | Add validation |
| `backend/src/claim-codes/claim-codes.controller.ts` | Add validation |
| `backend/src/keywords/keywords.controller.ts` | Add validation |
| `backend/src/workspaces/workspace.controller.ts` | Add validation |
| `backend/src/devices/devices.controller.ts` | Add validation |
| `backend/src/auth/auth.service.ts` | Fix hashRefreshToken |
| `backend/src/main.ts` | Fix CORS default |
| `backend/src/health/health.controller.ts` | Sanitize URL |
| `docker-compose.yml` | Remove hardcoded secret |
| `backend/.env.example` | Add REFRESH_TOKEN_SECRET |
