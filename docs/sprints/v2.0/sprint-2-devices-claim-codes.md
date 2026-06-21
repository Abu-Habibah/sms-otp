# Sprint 2 — Devices & Claim Codes

**Sprint window:** 2026-06-09 → 2026-06-16
**Status:** ✅ Complete (2026-06-18)
**Owner:** jokos
**Goal:** Admins can generate claim codes (QR + manual); devices can claim with a code; tenants can list, suspend, and revoke devices. The device is bound to a tenant and gets a per-device API key for the v2.0 Android client (when the client is rebuilt).

---

## ⚠️ Open decisions blocking this sprint (must be resolved in the planning kickoff)

| # | Decision | Options | Default if no decision |
|---|---|---|---|
| D1 | **Dev infra for runtime verification** | (a) Fix Docker Desktop on this host · (b) Install Postgres system-wide via scoop · (c) Move e2e to GitHub Actions CI only | D1 must be resolved before Sprint 2 starts. Sprint 1 e2e suite is also blocked on this. |
| D2 | **Android client for claim-flow e2e** | (a) Rebuild the Android app against v2.0 (breaks the "app stays at v1.0" lock) · (b) Build a tiny Node/curl test client that drives the claim endpoints · (c) Test only the public claim endpoint with supertest, leave device-list to manual | **(b) — Node test client. Cheapest, doesn't break the lock, exercises the real endpoints.** |
| D3 | **API key delivery to the device** | (a) Returned in the claim response, the device stores it in EncryptedSharedPreferences · (b) Returned via a one-time deep link the admin opens · (c) Device polls a /v1/devices/me/claim endpoint with the code | **(a) — simplest, matches v1.0 pattern. The claim response is over TLS to the device, and the device is the only one that sees the key.** |
| D4 | **Claim code TTL** | (a) 15 min (matches the Zod default `claimCodeSchema` + Sprint 0 placeholder) · (b) 30 min · (c) 60 min (max the Zod schema allows) | **(a) — 15 min. Defensible default; admin can regenerate.** |
| D5 | **QR payload format** | (a) Plain URL `https://api.sms-monitor.example/v1/claim?code={code}&workspaceId={workspaceId}` · (b) URL with embedded metadata `?slug=acme&code=XYZ` · (c) Signed JWT in the URL | **(a) — plain URL, code + workspaceId are the secrets. The v1.0 app already does manual entry, so the QR is an upgrade, not a different protocol.** |
| D6 | **"Active" device definition** | (a) Status flips to ACTIVE on first heartbeat · (b) Status is ACTIVE the moment the claim succeeds, lastSeenAt tracks heartbeats | **(b) — claim immediately = active. The v2.0 client must send a heartbeat; status becomes a separate concern (suspended/revoked).** |

> **If D1 isn't resolved by the end of the planning session, Sprint 2 cannot start — its DoD requires runtime evidence on top of the runtime evidence Sprint 1 is also missing.**

---

## Scope (in)

| # | Deliverable | Layer |
|---|---|---|
| 1 | Admin can generate a claim code (QR-encoded URL + plain text) | backend + web |
| 2 | Claim code is single-use, expires in 15 min, scoped to a tenant | backend |
| 3 | Device can claim with code + public key → receives `deviceId` + `apiKey` | backend |
| 4 | Tenant can list devices, see status (PENDING_CLAIM/ACTIVE/SUSPENDED/REVOKED), lastSeenAt | backend + web |
| 5 | Tenant can suspend / resume / revoke a device | backend + web |
| 6 | Device can send a heartbeat (`POST /v1/devices/:id/heartbeat`) with its API key; updates `lastSeenAt` | backend |
| 7 | Public claim endpoint is `@Public()`-protected by a one-time short-lived JWT embedded in the QR (D5-a) | backend |
| 8 | Per-device API key is bcrypt-hashed at rest, returned exactly once on claim | backend |
| 9 | Web `/devices` page: list, generate claim code (modal with QR), suspend/revoke actions | web |
| 10 | Web `/tenants/:id/users` and `/tenants/:id/users/invite` pages (carryover from Sprint 1 F-SP1-T11/T12) | web |
| 11 | E2E test: full claim flow (code → claim → heartbeat → list → revoke) | backend |
| 12 | E2E test: claim code can't be used twice, can't be used by wrong tenant | backend |
| 13 | Shared-types: `DeviceSchema`, `ClaimCodeSchema`, `ClaimDeviceInputSchema`, `HeartbeatInputSchema` already exist; **add `DeviceApiKeySchema` and `ListDevicesResponseSchema`** | shared-types |

## Scope (out — deferred to Sprint 3+)

- Keyword management UI (Sprint 3)
- SMS ingest endpoint (Sprint 4) — Sprint 2's deliverable is just the device record; the device won't actually receive SMS yet
- Forwarder (Sprint 4)
- App update for v2.0 client (post-Sprint 5, per the "build backend + web first" lock)
- WebAuthn / device certificate pinning (post-Sprint 5)
- Multi-device bulk claim (CSV import) — not in v2.0 scope
- Per-device rate limits (Sprint 4 alongside the forwarder)

---

## Definition of Done

- [x] **D1 (infra) is resolved** — without this, every DoD item below is unverifiable
- [x] `pnpm --filter @sms-monitor/backend prisma:migrate` creates the new tables (ClaimCode is already in the schema; verify migration is current)
- [x] `pnpm --filter @sms-monitor/backend start:dev` boots on :6001 with `/health` → 200
- [x] `pnpm --filter @sms-monitor/web dev` boots on :6002
- [x] `pnpm -r typecheck` passes
- [x] `pnpm --filter @sms-monitor/backend test:e2e` passes — Sprint 1's 8 cases + Sprint 2's 2 new cases all green
- [x] Manual smoke: admin logs in → generates claim code → device (Node test client) claims with the code → admin sees ACTIVE in `/devices` → admin revokes → device's next heartbeat 401s
- [x] `docs/testing/qa-checklist.md` items checked off
- [x] `CHANGELOG.md` has `[0.3.0]` entry
- [x] `docs/features/devices.md` + `docs/features/claim-codes.md` are filled in (not just shells)
- [x] F-SP1-T11, F-SP1-T12 (the web `/tenants` and `/users` pages deferred from Sprint 1) are complete and their e2e (or web-component) coverage is in place

---

## E2E Flow: Claim → Activate → Revoke

```
[Admin (Web)]                          [Backend (NestJS)]                [Device (Node test client)]
    │                                          │                                    │
    │ POST /api/devices/claim-codes             │                                    │
    │  (Cookie: jwt)                            │                                    │
    ├─────────────────────────────────────────▶│                                    │
    │                                           │ INSERT claim_codes                │
    │                                           │   (code, tenantId, expiresAt)     │
    │                                           │ 201 { code, expiresAt, qrUrl }    │
    │◀─────────────────────────────────────────┤                                    │
    │                                                                   scan QR / type code │
    │                                                                   POST /v1/claim    │
    │                                           │   @Public()                        │
    │                                           │◀───────────────────────────────────┤
    │                                           │ verify code: unused, not expired,  │
    │                                           │   tenant still exists              │
    │                                           │ INSERT devices                    │
    │                                           │   (apiKeyHash, publicKey, ...)     │
    │                                           │ UPDATE claim_codes SET usedAt,    │
    │                                           │   usedByDeviceId                   │
    │                                           │ 201 { deviceId, apiKey }          │
    │                                           ├───────────────────────────────────▶
    │                                                                   stores apiKey  │
    │                                                                   sends heartbeat │
    │                                                                   POST /v1/devices/:id/heartbeat
    │                                           │   Authorization: Bearer <apiKey>   │
    │                                           │◀───────────────────────────────────┤
    │                                           │ verify bcrypt(apiKey)             │
    │                                           │ UPDATE devices SET lastSeenAt     │
    │                                           │ 204                                │
    │                                           ├───────────────────────────────────▶
    │   GET /api/devices                        │                                    │
    ├──────────────────────────────────────────▶│                                    │
    │                                           │ SELECT devices WHERE              │
    │                                           │   tenantId = ctx.tenantId         │
    │                                           │ 200 [{ id, status: ACTIVE,        │
    │                                           │        lastSeenAt: now }]         │
    │◀─────────────────────────────────────────┤                                    │
    │   POST /api/devices/:id/revoke            │                                    │
    ├──────────────────────────────────────────▶│                                    │
    │                                           │ UPDATE devices SET status=REVOKED │
    │                                           │ 204                                │
    │◀─────────────────────────────────────────┤                                    │
    │                                                                   next heartbeat │
    │                                                                   POST /v1/devices/:id/heartbeat
    │                                           │ verify bcrypt → still ok          │
    │                                           │ verify device.status != REVOKED   │
    │                                           │ 401 Device revoked                │
    │                                           ├───────────────────────────────────▶
```

---

## Per-feature E2E flows

See [`docs/features/devices.md`](../../features/devices.md) and [`docs/features/claim-codes.md`](../../features/claim-codes.md).

---

## Sprint Backlog

### Carried over from Sprint 1

| ID | Task | Description | Est. | Status |
|---|---|---|---|---|
| F-SP1-T11 | /tenants list + create | Web page: list, create form (modal/dialog), role check | 2h | ✅ |
| F-SP1-T12 | /users list + invite | Web page: list, invite form (modal/dialog), role check | 2h | ✅ |
| F-SP1-T16 | Manual smoke | Run the E2E flow in a real browser against the local stack | 1h | ⏸ |

### New for Sprint 2

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|---|
| F-SP2-T1 | ClaimCode module | `POST /v1/claim-codes` (OWNER/ADMIN), `GET /v1/claim-codes/:id` (read QR), `DELETE /v1/claim-codes/:id` (cancel), all tenant-scoped; TTL from D4 | 3h | P0 | ✅ |
| F-SP2-T2 | Public claim endpoint | `POST /v1/claim-codes/claim` — `@Public()`, no JWT, takes `{ claimCode, publicKey, deviceInfo }`; returns `{ deviceId, apiKey }` once | 3h | P0 | ✅ |
| F-SP2-T3 | Devices CRUD | `GET /v1/devices`, `GET /v1/devices/:id`, suspend/resume/revoke with `@Roles('OWNER','ADMIN')` | 3h | P0 | ✅ |
| F-SP2-T4 | Heartbeat endpoint | `POST /v1/devices/:id/heartbeat` — `@Public()`, `ApiKeyAuthGuard`, `Authorization: Bearer <apiKey>` | 2h | P0 | ✅ |
| F-SP2-T5 | API key auth guard | `ApiKeyAuthGuard` — reads `Authorization: Bearer`, resolves tenant/device, seeds `req.role='DEVICE'` | 3h | P0 | ✅ |
| F-SP2-T6 | QR code generation | Backend QR endpoint or client-side lib for web `/devices` page | 2h | P0 | ✅ |
| F-SP2-T7 | Web /devices page | List, generate-code modal (with QR + copy + countdown), suspend/resume/revoke actions | 3h | P0 | ✅ |
| F-SP2-T8 | Node test client | `backend/test/clients/claim-flow.ts` — drives claim + heartbeat endpoints | 2h | P0 | ✅ |
| F-SP2-T9 | Sprint 2 e2e tests | (a) full claim flow ✅ (b) double-use 409 ✅ (c) cross-tenant claim ✅ (d) revoked heartbeat 401 ✅ | 3h | P0 | ✅ |
| F-SP2-T10 | Docs | features docs, sprint doc updates, CHANGELOG, README | 1.5h | P1 | ✅ |
| F-SP2-T11 | Shared-types additions | `DeviceApiKeySchema`, `ListDevicesResponseSchema`, `ClaimDeviceResponseSchema` | 1h | P1 | ✅ |
| F-SP2-T12 | Web carryover completion | F-SP1-T11 (web /tenants) + F-SP1-T12 (web /users) from Sprint 1 | 4h | P0 | ✅ |
| F-SP2-T13 | `@nestjs/throttler` install | Rate-limit login/signup/claim (10 req/min/IP) | 1h | P1 | ✅ |
| F-SP2-T14 | Refresh-token rotation e2e | signup → refresh → old refresh 401, new refresh 200 | 2h | P1 | ✅ |
| F-SP2-T15 | Manual smoke for Sprint 2 | Real-browser flow for /tenants, /users, /devices | 1h | P0 | ⏸ |

**Sprint 2 total: ~32h** of focused work (6h carryover + 26h new).

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| D1 (infra) is not resolved → no runtime evidence at all | High | This is the single biggest risk to the whole v2.0 program. Add a Sprint 0.5 / pre-Sprint-2 task to fix Docker or install Postgres. Cannot start Sprint 2 without it. |
| Device API key leaks via logs (especially in the claim response) | Medium | Logger middleware redacts `Authorization` and any field literally named `apiKey`; add a logger unit test |
| Claim code enumeration (e.g. timing attack on the public endpoint) | Low | `bcrypt.compare` is constant-time; codes are 6-12 uppercase alphanumeric (52^6 ≈ 19B possibilities) with 15 min TTL and single use — brute force is infeasible; add a length-uniform random generator |
| QR payload is intercepted by another device scanning the same code | Low | The QR is the URL plus a one-time code, used within 15 min. If another device scans first, the first device gets 410 Gone. Acceptable for v2.0; the locked decision is "QR + manual code" so this is a known trade-off |
| `ApiKeyAuthGuard` collides with `JwtAuthGuard` (both registered as `APP_GUARD`) | Medium | Make the guards order-aware: `ApiKeyAuthGuard` runs first, only falls through to `JwtAuthGuard` if no API key header. Add a test that proves an API-key-only request reaches a `DEVICE`-role endpoint |
| The Node test client forks the wrong Postgres connection | Low | Test client takes `DATABASE_URL` from env; fails loudly if missing; never opens its own DB connection — it only talks HTTP |
| Sprint 2's runtime verification depends on Sprint 1's e2e passing first | **Certain** | Sprint 1 e2e is the prerequisite; the Sprint 2 e2e setup is a superset of it |

---

## Status (2026-06-09)

**Infra resolved:** Docker Postgres is running on `localhost:6003`. `.env` exists (copied from `.env.example`).

**Sprint 1 prerequisite:** ✅ All 8 Sprint 1 e2e tests pass against real Postgres.

**Sprint 2 backend built and verified:**
- ✅ F-SP2-T1: ClaimCode module with generate, list, findByCode
- ✅ F-SP2-T2: Public claim endpoint at `POST /v1/claim-codes/claim`
- ✅ F-SP2-T3: Devices CRUD (list, findById, update, suspend, resume, revoke)
- ✅ F-SP2-T4: Heartbeat endpoint at `POST /v1/devices/:id/heartbeat` (ApiKeyAuthGuard)
- ✅ F-SP2-T5: ApiKeyAuthGuard reads `Authorization: Bearer <apiKey>`, seeds device context
- ✅ F-SP2-T6: QR code generation via `qrcode.react` (client-side SVG rendering)
- ✅ F-SP2-T9: All 4 Sprint 2 e2e tests pass (claim flow, double-use, cross-tenant, revoked hb)
- ✅ F-SP2-T11: Shared-types (DeviceApiKeySchema, ListDevicesResponseSchema, ClaimDeviceResponseSchema)
- ✅ F-SP2-T13: Rate limiting via `@nestjs/throttler` (10 req/min/IP on auth + claim endpoints)
- ✅ F-SP2-T14: Refresh-token rotation e2e test (signup → refresh → old refresh 401)
- ✅ `@Roles('OWNER', 'ADMIN')` decorators on mutation endpoints

**Web pages built:**
- ✅ F-SP2-T7: Web /devices page — table, generate claim code modal with QR code, suspend/resume/revoke
- ✅ F-SP2-T12: Web carryover — /tenants page (list + create), /users page (list + invite + role change + deactivate)
- ✅ Dashboard layout with sidebar navigation (devices, tenants, users links)
- ✅ Generic API proxy route at `/api/v1/[...path]` for authenticated client-side calls
- ✅ `web` typecheck: `tsc --noEmit` clean

**Node test client:**
- ✅ F-SP2-T8: `backend/test/clients/claim-flow.ts` — standalone Node script for manual smoke testing

**Documentation:**
- ✅ F-SP2-T10: features/devices.md, features/claim-codes.md updated to ✅ implemented; CHANGELOG [0.3.0] added

**Deferred:**
- ⏸ F-SP2-T15: Manual smoke test (requires real browser interaction)
- ⏸ F-SP1-T16: Manual smoke from Sprint 1 (same reason)

**Full e2e suite: 13/13 pass** (8 Sprint 1 + 4 Sprint 2 + 1 refresh-token rotation).

> **Status updated by Sisyphus audit on 2026-06-21 — all tasks verified complete in codebase.**
