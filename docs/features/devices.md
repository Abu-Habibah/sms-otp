# Feature: Devices

> **Status:** ✅ Sprint 2 — implemented and e2e-verified.

A **Device** is a phone running the SMS Monitor v2.0 Android client (or, for v2.0 development, a Node test client). Each device belongs to exactly one tenant. A device holds a **per-device API key** that it uses to authenticate to the backend for the `/v1/devices/:id/heartbeat` and (later, in Sprint 4) the `/v1/sms` ingest endpoint.

---

## Model

```prisma
model Device {
  id           String       @id @default(uuid())
  tenantId     String
  workspaceId  String
  name         String
  status       DeviceStatus @default(PENDING_CLAIM)
  deviceSecret String       // HMAC signing key (never sent to web/admin UI)
  apiKey       String       @unique @default(cuid())
  publicKey    String?      // device's public key (for signed-payload forwarder)
  manufacturer   String?
  model          String?
  osVersion      String?
  appVersion     String?
  simSlot1Number String?
  simSlot2Number String?
  deviceModel    String?
  androidVersion String?
  lastHeartbeat  DateTime?
  identifyRequestedAt DateTime?
  identifyAckedAt     DateTime?
  lastSeenAt   DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  tenant     Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  workspace  Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  smsLogs    SmsLog[]

  @@index([tenantId])
  @@index([workspaceId])
  @@map("devices")
}

enum DeviceStatus {
  PENDING_CLAIM
  ACTIVE
  SUSPENDED
  REVOKED
}
```

The `status` field is set to `ACTIVE` the moment a claim succeeds (decision D6 in `sprint-2-devices-claim-codes.md`); the device does **not** have to send a heartbeat to become active. A REVOKED device can be re-activated by re-claiming with the same public key (see AC-7a).

---

## Acceptance criteria (Sprint 2 target)

| # | Criterion |
|---|---|
| AC-1 | An authenticated OWNER or ADMIN can list all devices in their tenant via `GET /v1/devices`. Response is `{ devices: Device[] }`. |
| AC-2 | An authenticated OWNER or ADMIN can read one device via `GET /v1/devices/:id`. Cross-tenant reads return 404 (no enumeration). |
| AC-3 | A device in `PENDING_CLAIM` is reachable by id but its API key is not yet issued (the API key only exists after claim). |
| AC-4 | A device in `ACTIVE` can authenticate to `POST /v1/devices/:id/heartbeat` with its API key and have its `lastSeenAt` updated. |
| AC-5 | A device in `SUSPENDED` can be reactivated by an OWNER/ADMIN via `POST /v1/devices/:id/resume`. |
| AC-6 | A device in `SUSPENDED` returns 401 on heartbeat (the heartbeat endpoint rejects non-ACTIVE devices). |
| AC-7 | A device in `REVOKED` can be reactivated by an OWNER/ADMIN via `POST /v1/devices/:id/reactivate` (sets status to ACTIVE). |
| AC-8 | A device API key is bcrypt-hashed at rest. The raw key is returned in the claim response **once** together with `serverUrl` and never again. |
| AC-9 | The list response is sorted by `lastSeenAt DESC NULLS LAST, createdAt ASC`. |
| AC-10 | Suspending, resuming, revoking, and reactivating are OWNER/ADMIN only; suspending a REVOKED device is 409 Conflict. |
| AC-11 | Revoking a device sets `status = REVOKED` and the API key check still passes (so logs are preserved) but `lastSeenAt` is no longer updated. |
| AC-12 | An OWNER/ADMIN can edit a device's name via `PATCH /v1/devices/:id` with `{ name: string }`. |
| AC-13 | An OWNER/ADMIN can trigger identification on ACTIVE devices via `POST /v1/devices/:id/identify`. |
| AC-14 | Device schema uses `.nullish()` for optional fields to handle Prisma null values. |

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/devices` | JWT | List devices in the tenant |
| GET | `/v1/devices/:id` | JWT | Read one device (404 on cross-tenant) |
| PATCH | `/v1/devices/:id` | JWT, OWNER/ADMIN | Update device name |
| POST | `/v1/devices/:id/suspend` | JWT, OWNER/ADMIN | Set status to SUSPENDED |
| POST | `/v1/devices/:id/resume` | JWT, OWNER/ADMIN | Set status to ACTIVE (only from SUSPENDED) |
| DELETE | `/v1/devices/:id` | JWT, OWNER/ADMIN | Set status to REVOKED (terminal) |
| POST | `/v1/devices/:id/heartbeat` | API key (DEVICE) | Update lastSeenAt; rejects non-ACTIVE |

---

## Open questions (will be resolved during Sprint 2 implementation)

- **Display name uniqueness:** current `@@unique([tenantId, displayName])` is annoying if a tenant reuses names after revoking. Consider scoping the unique to `(tenantId, displayName, status != 'REVOKED')` — but Prisma doesn't support partial uniques, so we'd enforce in app code.
- **API key rotation:** for v2.0, a device gets one API key for life. If it's compromised, revoke + re-claim. Key rotation is a v3+ feature.
- **Heartbeat cadence:** the client picks a sensible default (e.g. every 60s when foregrounded, 5min when backgrounded). The backend doesn't dictate a cadence.

---

## Cross-references

- Sprint doc: [`docs/sprints/v2.0/sprint-2-devices-claim-codes.md`](../sprints/v2.0/sprint-2-devices-claim-codes.md)
- Companion feature: [`docs/features/claim-codes.md`](./claim-codes.md) (the "front door" of device onboarding)
- Auth: [`docs/features/auth.md`](./auth.md) (the JWT/auth model devices share with humans)
- v2.0 architecture: [`docs/architecture/v2.0-overview.md`](../architecture/v2.0-overview.md) (ADR on QR + manual code onboarding)
