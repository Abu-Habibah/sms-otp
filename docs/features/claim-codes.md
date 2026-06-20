# Feature: Claim Codes

> **Status:** ✅ Sprint 2 — implemented and e2e-verified. QR code format updated to include workspaceId. AC-10 (DELETE /:id) now implemented.

A **Claim Code** is a single-use, time-limited token that lets a new device bind itself to a tenant. The admin generates a code from the web dashboard, the device scans the QR (or types the code) and POSTs to the public `/v1/claim` endpoint with the code, its public key, and basic device metadata. On success the device receives a `deviceId`, a raw **API key** (the only time the raw key is ever exposed), and the `serverUrl` for all subsequent API calls.

---

## Model

```prisma
model ClaimCode {
  id             String    @id @default(uuid())
  tenantId       String
  workspaceId    String
  code           String    @unique
  createdBy      String    // user who generated it
  expiresAt      DateTime
  usedAt         DateTime?
  usedByDeviceId String?   @unique
  createdAt      DateTime  @default(now())

  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([workspaceId])
  @@map("claim_codes")
}
```

The `code` is generated as 8 uppercase alphanumeric characters (no ambiguous chars like `0`/`O`, `1`/`I`/`L` to make manual entry easier). The QR encodes the URL `${publicApiUrl}/v1/claim?code=${code}&workspaceId=${workspaceId}` — the device opens the URL, extracts the code, API base URL, and workspaceId, then POSTs to `/v1/claim`. If QR scanning fails, the user can manually enter the server URL (saved after first use) and the claim code.

---

## Acceptance criteria (Sprint 2 target)

| # | Criterion |
|---|---|---|
| AC-1 | An authenticated OWNER/ADMIN can generate a claim code via `POST /v1/claim-codes` with optional `{ ttlMinutes }` (5..60, default 15). Response includes `{ id, code, expiresAt, qrPayload }`. |
| AC-2 | The `code` is 8 chars from the unambiguous alphabet `[ACDEFGHJKLMNPQRTUVWXY2346789]` (24 chars, 24^8 ≈ 110B possibilities). |
| AC-3 | The `qrPayload` is the URL `${publicApiUrl}/v1/claim?code=${code}&workspaceId=${workspaceId}`. The web `/devices` page renders this as an SVG QR. |
| AC-4 | A claim code is single-use: the second `POST /v1/claim` with the same code returns 410 Gone. |
| AC-5 | A claim code is TTL-bounded: an expired code returns 410 Gone. |
| AC-6 | The `POST /v1/claim` endpoint is `@Public()` — no JWT required — but it must validate the code, expiry, and tenant. |
| AC-7 | On successful claim, a `Device` row is created (status `ACTIVE`, with a bcrypt-hashed API key and the device's public key), the `ClaimCode` row is marked `usedAt` + `usedByDeviceId`, and the response is `{ deviceId, apiKey, serverUrl }` (raw key, shown once; serverUrl is the base URL for all subsequent device-to-backend calls). |
| AC-7a | If a device with the same public key already exists in a REVOKED state, the claim reactivates it (status → `ACTIVE`, updates device info and heartbeat) instead of creating a duplicate. Returns the existing device's API key. |
| AC-8 | If the tenant no longer exists (e.g. was deleted between code generation and claim), the claim returns 410 Gone (not 404, to avoid leaking tenant existence to the device). |
| AC-9 | An OWNER/ADMIN can list their tenant's claim codes via `GET /v1/claim-codes`. Unused codes are listed; used codes are listed with `usedAt` and `usedByDeviceId`. |
| AC-10 | An OWNER/ADMIN can cancel an unused claim code via `DELETE /v1/claim-codes/:id` (sets `expiresAt = now()`). Used codes cannot be cancelled (409 Conflict). Implemented in Sprint 8. |
| AC-11 | The `code` lookup is constant-time (no early-return on first mismatch) to prevent timing attacks. The implementation reads the code with `prisma.claimCode.findUnique` and the bcrypt-style comparison is on the API key only. |
| AC-12 | Rate-limit: `POST /v1/claim` is throttled to 10 req/min/IP via `@nestjs/throttler` (per `auth.md` AC-10, rolled into Sprint 2's throttler work). |

### Manual entry fallback

If QR scanning fails, the device shows a setup screen with:
1. **Server URL** — entered once, saved in EncryptedSharedPreferences for subsequent claims
2. **Claim Code** — 8-character code provided by the admin

The claim flow is identical regardless of QR vs. manual entry. The `serverUrl` is also returned in the claim response as a confirmation.

---

## Endpoints (proposed)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/claim-codes` | JWT, OWNER/ADMIN | Generate a claim code |
| GET | `/v1/claim-codes` | JWT, OWNER/ADMIN | List claim codes (with `usedAt` info) |
| GET | `/v1/claim-codes/:id` | JWT, OWNER/ADMIN | Read one (also returns `qrPayload`) |
| DELETE | `/v1/claim-codes/:id` | JWT, OWNER/ADMIN | Cancel an unused code |
| POST | `/v1/claim` | `@Public()` | Claim with a code, get a device + apiKey |

---

## Open questions (will be resolved during Sprint 2 implementation)

- **Code entropy:** 8 chars from 24-char alphabet = 110B possibilities; combined with 15min TTL and single-use, brute force is computationally infeasible. If we want to be belt-and-suspenders, we can add the tenantId to the code (e.g. `acme-XYZ2H7PK`) so codes can't even be tried against the wrong tenant. Decision deferred to D7 in the sprint kickoff.
- **Code generation timing safety:** Node's `crypto.randomInt` is fine. No need for `getRandomValues` shenanigans.
- **QR rendering location:** decision D5a says backend-issued URL, web renders the QR. The alternative is backend-issued SVG/PNG. Going with the former to keep the backend pure-JSON.

---

## Cross-references

- Sprint doc: [`docs/sprints/v2.0/sprint-2-devices-claim-codes.md`](../sprints/v2.0/sprint-2-devices-claim-codes.md)
- Companion feature: [`docs/features/devices.md`](./devices.md) (what the claim creates)
- Auth: [`docs/features/auth.md`](./auth.md) (the JWT model the admin uses to generate codes)
- Architecture: [`docs/architecture/v2.0-overview.md`](../architecture/v2.0-overview.md) — ADR on QR + manual code onboarding
