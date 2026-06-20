# Sprint 5 — Android v2.0 Client (Device Onboarding)

**Sprint window:** 2026-06-11 → 2026-06-11
**Status:** ✅ Complete
**Owner:** jokos
**Goal:** The Android app can onboard itself to a tenant via QR scan or manual entry. After a successful claim, it stores the server URL + API key in EncryptedSharedPreferences and starts the SMS monitoring + heartbeat loop.

---

## What exists already

| File | Purpose | Status |
|------|---------|--------|
| `ClaimCodeScannerActivity.kt` | QR scanner with CameraX + ML Kit | 🟡 Stub (scans QR but not wired to v2.0 flow) |
| `ManualCodeEntryActivity.kt` | Manual claim code entry | 🟡 Stub (no server URL field) |
| `TenantSelectionActivity.kt` | Tenant selection at first launch | 🟡 Stub |
| `ClaimService.kt` | HTTP POST to `/v1/claim-codes/claim` | 🟡 Missing `serverUrl` in response handling |
| `SettingsRepository.kt` | EncryptedSharedPreferences storage | ✅ Has `backendUrl`, `apiKey`, `deviceId`, etc. |

---

## Scope (in)

| # | Deliverable | Layer |
|---|---|---|
| 1 | First-launch detection: if no saved URL + key, show onboarding flow instead of monitoring | Android |
| 2 | QR scanner: extract `serverUrl` + `claimCode` from QR payload (`<serverUrl>/v1/claim?code=<code>`) | Android |
| 3 | Manual entry: two-field form (Server URL + Claim Code), URL is saved for subsequent uses | Android |
| 4 | Claim service: update `ClaimResponse` to include `serverUrl`, save it alongside `apiKey` | Android |
| 5 | Post-claim: auto-start SMS monitoring + heartbeat loop after successful claim | Android |
| 6 | Settings screen: show connected device status, allow re-claim | Android |
| 7 | Backend: claim response already includes `serverUrl` (done in Sprint 4.5) | backend |
| 8 | End-to-end test: signup → generate claim code → scan QR → claim → heartbeat → forward SMS | integration |

## Scope (out)

- Multi-tenant switch (user can't re-select tenant after claim — factory reset to re-onboard)
- FCM / push notifications
- OTA app update mechanism
- iOS client

---

## E2E Flow: First Launch → Claim → Monitor

```
[Device First Launch]
        │
        ▼
[Check EncryptedSharedPreferences]
        │
        ├── has URL + key ──▶ [Start monitoring service]
        │
        └── missing ──▶ [Show Onboarding Screen]
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
           [Scan QR]         [Manual Entry]
                  │                 │
                  │   serverUrl     │   serverUrl + code
                  │   + claimCode   │
                  └────────┬────────┘
                           ▼
                  POST /v1/claim-codes/claim
                           │
                           ▼
               { deviceId, apiKey, serverUrl }
                           │
                           ▼
             Save to EncryptedSharedPreferences
                           │
                           ▼
             Start heartbeat loop
             Start SMS monitoring
```

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP5-T1 | Setup screen | New activity/fragment shown on first launch with QR scan, manual entry, and skip options. Detect `isConfigured()` from SettingsRepository. | 3h | P0 | ✅ |
| F-SP5-T2 | QR scanner integration | Update `ClaimCodeScannerActivity` to parse QR payload format `<serverUrl>/v1/claim?code=<code>`. Extract origin as server URL, code param as claim code. | 4h | P0 | ✅ |
| F-SP5-T3 | Manual entry screen | Update `ManualCodeEntryActivity` to add Server URL input field. First-time users must enter URL. Subsequent re-claims pre-fill URL from saved preferences. | 3h | P0 | ✅ |
| F-SP5-T4 | Claim service update | Update `ClaimResponse` data class to include `serverUrl`. Save `settingsRepository.backendUrl` from response. | 1h | P0 | ✅ |
| F-SP5-T5 | Post-claim transition | After successful claim, navigate to monitoring main screen and start heartbeat + SMS forwarding services. | 2h | P0 | ✅ |
| F-SP5-T6 | Settings status | Show device ID, server URL, connection status in Settings screen. Add "Re-claim" button. | 2h | P1 | ✅ |
| F-SP5-T7 | Heartbeat loop | Ensure `POST /v1/devices/:id/heartbeat` starts after claim using stored API key. | 2h | P0 | ✅ |
| F-SP5-T8 | Error handling | Network errors, invalid codes, expired codes, camera permission denied — all with user-facing messages. | 2h | P1 | ✅ |
| F-SP5-T9 | E2e test | Full integration test: signup → generate code → QR scan → claim → heartbeat → send SMS → match keyword → forward | 3h | P0 | ✅ |
| F-SP5-T10 | Docs | Update Android onboarding doc, CHANGELOG [0.6.0], README index | 1.5h | P1 | ✅ |

**Sprint 5 total: ~23.5h** of focused work.

---

## Key Android Dependencies

Already in `build.gradle.kts`:
- `androidx.camera:camera-camera2` — CameraX for QR scanning
- `com.google.mlkit:barcode-scanning` — ML Kit for barcode/QR decoding
- `androidx.security:security-crypto` — EncryptedSharedPreferences
- `com.squareup.okhttp3:okhttp` — HTTP client
- `com.google.code.gson:gson` — JSON parsing
- `com.google.dagger:hilt-android` — DI

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Camera permission denied on some OEMs (ColorOS, MIUI) | Medium | Fallback to manual entry immediately when camera permission is denied |
| QR code scanned by wrong device (race condition) | Low | Code is single-use; second claim returns 409 |
| Server URL entered incorrectly in manual mode | Medium | Validate URL format before submitting; test connectivity with a health check call |
| EncryptedSharedPreferences key rotation breaks existing installs | Low | MasterKey.DEFAULT_MASTER_KEY_ALIAS handles this; test upgrade path |

---

## Status

_Sprint 5 completed 2026-06-11. All 10 tasks delivered. Build: v2.0 (Build: 15)._
