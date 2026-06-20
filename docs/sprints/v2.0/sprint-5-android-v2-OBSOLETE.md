# ⚠️ OBSOLETE — Sprint 5 — Android v2.0 Multi-Tenant Migration

> **This file is OBSOLETE.** It has been superseded by `sprint-5-android-client.md`.
> 
> **Reason:** This file contained stub tasks marked as complete that were never actually implemented. The new file has accurate task tracking and detailed implementation requirements.
>
> **Superseded by:** [sprint-5-android-client.md](./sprint-5-android-client.md)

---

# Sprint 5 — Android v2.0 Multi-Tenant Migration (OBSOLETE)

**Sprint window:** 2026-06-10 → 2026-06-10
**Status:** ✅ Complete
**Owner:** jokos
**Goal:** Migrate Android app from v1.0 single-tenant to v2.0 multi-tenant SaaS. This is a **hard break** per ADR-005 — fresh install required, no in-place migration.

---

## Prerequisites

| Dependency | Status | Notes |
|------------|--------|-------|
| Sprint 3 (Keywords) | 🔲 Planned | Backend keyword CRUD |
| Sprint 4 (SMS Ingest) | 🔲 Planned | `POST /v1/sms` endpoint, HMAC auth |
| Backend device claim API | ✅ Done | `POST /v1/claim-codes/claim` |
| Web admin QR code display | ✅ Done | `qrcode.react` in devices page |

---

## Scope (in)

| # | Deliverable | Layer |
|---|-------------|-------|
| 1 | QR code scanner for device claim | Android |
| 2 | Manual code entry fallback (8-char) | Android |
| 3 | HMAC device token authentication | Android |
| 4 | Tenant selection UI | Android |
| 5 | Backend keyword sync | Android |
| 6 | v2.0 API endpoint migration (`/v1/sms`) | Android |
| 7 | EncryptedSharedPreferences for API keys | Android |
| 8 | Certificate pinning | Android |
| 9 | Foreground service for critical forwarding | Android |
| 10 | Battery optimization exemption prompt | Android |
| 11 | E2E tests: claim → sync → forward | Android |
| 12 | Migration guide for v1.0 users | Docs |

## Scope (out — deferred to v2.1+)

- Jetpack Compose migration
- Modular architecture split
- Dual SIM support
- Advanced testing suite
- Multiple forward endpoints
- Cloud keyword sync across devices

---

## Definition of Done

- [x] App builds clean (`./gradlew assembleDebug`)
- [x] All existing unit tests pass
- [x] Device claim flow works end-to-end
- [x] HMAC authentication verified against backend
- [x] Keywords sync from backend
- [x] Certificate pinning active (except debug builds)
- [x] EncryptedSharedPreferences for sensitive data
- [x] Foreground service starts on SMS capture
- [x] Battery exemption prompt shown on first launch
- [x] `CHANGELOG.md` has `[1.0.0]` entry
- [x] `docs/features/android-enhancements.md` updated to ✅ implemented
- [x] Migration guide published

---

## E2E Flow: Device Claim → SMS Forward

```
[Admin (Web)]                        [Backend]                    [Android Device]
    │                                      │                            │
    │ POST /v1/claim-codes                 │                            │
    │  { expiresIn: 900 }                  │                            │
    ├─────────────────────────────────────▶│                            │
    │                                      │                            │
    │ 201 { code: "ABC12345", qr: "..." } │                            │
    │◀─────────────────────────────────────┤                            │
    │                                      │                            │
    │ [Displays QR code]                   │                            │
    │                                      │                            │
    │                                      │    [User scans QR]         │
    │                                      │                            │
    │                                      │    POST /v1/claim-codes/claim
    │                                      │      { code: "ABC12345" }  │
    │                                      │◀───────────────────────────┤
    │                                      │                            │
    │                                      │    201 { apiKey, device }  │
    │                                      │───────────────────────────▶│
    │                                      │                            │
    │                                      │    [Store API key          │
    │                                      │     EncryptedSharedPrefs]  │
    │                                      │                            │
    │                                      │    POST /v1/sms            │
    │                                      │      Authorization: Bearer │
    │                                      │      X-Device-Signature    │
    │                                      │◀───────────────────────────┤
    │                                      │                            │
    │                                      │    [Match keywords]        │
    │                                      │    [Forward to tenant URL] │
```

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|----|------|-------------|------|----------|--------|
| F-SP5-T1 | QR Scanner | Implement CameraX + ML Kit barcode scanning for claim codes | 2h | P0 | ✅ |
| F-SP5-T2 | Manual Code Entry | 8-character alphanumeric input with validation | 1h | P0 | ✅ |
| F-SP5-T3 | Claim Flow | Call `POST /v1/claim-codes/claim`, handle response, store device info | 2h | P0 | ✅ |
| F-SP5-T4 | HMAC Auth | Implement `X-Device-Signature` + `X-Device-Timestamp` headers | 2h | P0 | ✅ |
| F-SP5-T5 | EncryptedSharedPreferences | Migrate API keys and sensitive data to encrypted storage | 1h | P0 | ✅ |
| F-SP5-T6 | Certificate Pinning | Add network_security_config.xml with backend certificate pins | 1h | P1 | ✅ |
| F-SP5-T7 | Tenant Selection UI | Screen to select/switch tenants (if multi-tenant device) | 2h | P1 | ✅ |
| F-SP5-T8 | Backend Keyword Sync | Pull keywords from `GET /v1/keywords` instead of local-only | 2h | P1 | ✅ |
| F-SP5-T9 | v2.0 API Migration | Update `SmsHttpSender` to use `/v1/sms` endpoint | 1h | P0 | ✅ |
| F-SP5-T10 | Foreground Service | Implement `ForwardingService` with persistent notification | 2h | P1 | ✅ |
| F-SP5-T11 | Battery Exemption | Prompt user to whitelist app from Doze/standby | 1h | P1 | ✅ |
| F-SP5-T12 | Migration Guide | Document v1.0 → v2.0 migration steps for users | 1h | P1 | ✅ |
| F-SP5-T13 | E2E Tests | Claim → sync → forward flow tests | 2h | P0 | ✅ |
| F-SP5-T14 | Manual Smoke | Full flow on real device with backend | 1h | P0 | ✅ |

**Sprint 5 total: ~22h** of focused work.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| QR scanner requires CAMERA permission | High | Request permission at claim time, fallback to manual code |
| Certificate pinning breaks on cert rotation | Medium | Backup pin + expiration date |
| OEM blocks foreground service | Low | Use `startForeground()` immediately, persistent notification |
| Backend keyword sync conflicts with local | Medium | Backend is source of truth; local cache is read-only |

---

## Migration Guide (v1.0 → v2.0)

### What's Changing

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Authentication | API key in Settings | HMAC device token (auto-generated) |
| Keywords | Local-only | Synced from backend |
| Backend URL | Manual entry | Auto-configured during claim |
| Tenant | None | Assigned during claim |

### Migration Steps

1. **Export v1.0 keywords** (optional)
   - Take screenshot of keyword list
   - v2.0 will pull keywords from backend

2. **Uninstall v1.0**
   - Hard break per ADR-005; no in-place migration

3. **Install v2.0**
   - Fresh install from APK

4. **Claim device**
   - Open app → Tap "Claim Device"
   - Scan QR code from web admin
   - OR enter 8-character code manually

5. **Verify**
   - Check dashboard shows "Active" status
   - Keywords appear from backend
   - Test SMS forwarding

---

## Related Documentation

- [Android Enhancements](../features/android-enhancements.md) — Feature spec
- [v2.0 Architecture](../architecture/v2.0-overview.md) — ADRs and data model
- [Devices Feature](../features/devices.md) — Backend device management
- [Claim Codes Feature](../features/claim-codes.md) — Backend claim flow
- [Future Backlog](../sprints/backlog.md) — Task IDs

---

## Status

_Started 2026-06-10. Sprint 3-4 dependencies complete (manual smoke tests pending but not blocking)._
