# Device Onboarding — Android App

> **Status:** ✅ v2.0 — implemented
> **Last Updated:** 2026-06-11

## Overview

The Android app needs two pieces of information to function in v2.0:

| Configuration | Purpose | How it's obtained |
|---------------|---------|-------------------|
| **Server URL** | Backend API base URL (`https://api.sms-monitor.com`) | QR scan (primary) or manual entry (fallback) |
| **API Key** | Per-device authentication token (`Bearer <apiKey>`) | Claim response, returned once |

---

## Onboarding Flow

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  First Launch │────▶│  Setup Screen         │────▶│  Claim Success   │
│              │     │                      │     │                  │
│ No saved URL │     │  Option A: Scan QR   │     │  Save serverUrl  │
│ No saved key │     │  Option B: Enter URL  │     │  Save apiKey     │
│              │     │         + Code        │     │  Start heartbeat │
└──────────────┘     └──────────────────────┘     └──────────────────┘
```

### Step 1: First Launch Detection

On app startup, check `EncryptedSharedPreferences` for saved credentials:

```kotlin
val hasCredentials = settingsRepository.isConfigured()
// checks: backendUrl.isNotBlank() && apiKey.isNotBlank()
```

If `false` → show Setup Screen.
If `true` → proceed to monitoring service.

### Step 2: Setup Screen

Two entry points:

#### Option A — Scan QR (Primary)

- Opens camera to scan QR code
- QR payload format: `<serverUrl>/v1/claim?code=<claimCode>&workspaceId=<workspaceId>`
- Parses the URL to extract:
  - `serverUrl`: the URL origin (e.g. `https://api.sms-monitor.com`)
  - `claimCode`: the `code` query parameter
  - `workspaceId`: the `workspaceId` query parameter (optional)

#### Option B — Manual Entry (Fallback)

When QR scanning fails or is unavailable:

```
┌──────────────────────────────────┐
│  Configure Device                │
│                                  │
│  Server URL                      │
│  ┌────────────────────────────┐  │
│  │ https://api.example.com    │  │
│  └────────────────────────────┘  │
│                                  │
│  Claim Code                      │
│  ┌────────────────────────────┐  │
│  │ XYZ2H7PK                   │  │
│  └────────────────────────────┘  │
│                                  │
│  [Connect Device]                 │
└──────────────────────────────────┘
```

- **Server URL**: Entered by the user on first setup. After first successful claim, this value is saved and pre-filled on subsequent setups.
- **Claim Code**: 8-character code displayed in the web admin `/devices` page.

### Step 3: Claim Request

Both QR scan (`ClaimCodeScannerActivity`) and manual entry (`ManualCodeEntryActivity`) inject `DeviceInfoCollector` to collect hardware info before claiming.

```kotlin
suspend fun claim(serverUrl: String, code: String, deviceName: String): ClaimResult {
    val deviceInfo = DeviceInfoCollector.collectDeviceInfoWithSim()
    val response = httpClient.post("$serverUrl/v1/claim-codes/claim") {
        setBody(ClaimRequest(
            code = code,
            publicKey = devicePublicKey,
            deviceInfo = deviceInfo
        ))
    }
    return response.body<ClaimResponse>()
}

data class ClaimRequest(
    val code: String,
    val publicKey: String,
    val deviceInfo: DeviceInfo?
)

data class DeviceInfo(
    val manufacturer: String?,
    val model: String?,
    val osVersion: String?,
    val appVersion: String?,
    val simSlot1Number: String?,
    val simSlot2Number: String?,
    val deviceModel: String?,
    val androidVersion: String?
)

data class ClaimResponse(
    val device: DeviceInfo,
    val apiKey: String,
    val serverUrl: String,
    val deviceName: String  // user-editable device name
)
```

### Step 4: Save Credentials

```kotlin
// On success:
settingsRepository.backendUrl = claimResponse.serverUrl
settingsRepository.apiKey = claimResponse.apiKey
settingsRepository.deviceName = claimResponse.deviceName  // user-editable

// SettingsRepository uses EncryptedSharedPreferences:
private val securePrefs = EncryptedSharedPreferences.create(
    context,
    "sms_monitor_secure",
    MasterKey.DEFAULT_MASTER_KEY_ALIAS,
    context,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

### Step 5: Start Monitoring

Once credentials are saved:
1. `backendUrl` + `apiKey` are read from `EncryptedSharedPreferences` for every HTTP request
2. Device starts sending heartbeats (`POST /v1/devices/:id/heartbeat`)
3. Device starts SMS monitoring and forwarding

---

## QR vs Manual: When Each is Used

| Scenario | Method | Server URL source |
|----------|--------|-------------------|
| Fresh install, camera works | QR scan | Extracted from QR payload |
| Fresh install, camera broken | Manual entry | User types it |
| Subsequent re-claim (same server) | Manual entry (code only) | Pre-filled from saved preferences |
| Server URL changed | Manual entry | User updates it in settings |

---

## Settings Screen (Post-Setup)

After initial setup, the user can view/modify their configuration in Settings:

```
┌──────────────────────────────────┐
│  Settings                        │
│                                  │
│  Server URL                      │
│  ┌────────────────────────────┐  │
│  │ https://api.example.com    │  │
│  └────────────────────────────┘  │
│                                  │
│  API Key                         │
│  ┌────────────────────────────┐  │
│  │ sk_abc123… (masked)        │  │
│  └────────────────────────────┘  │
│                                  │
│  Device Name                     │
│  ┌────────────────────────────┐  │
│  │ Reception Phone            │  │
│  └────────────────────────────┘  │
│                                  │
│  [Show API Key]  [Re-claim]      │
│                                  │
│  Status: Connected ✓             │
│  Device ID: a1b2c3d4-...        │
│  Workspace: HR Department        │
└──────────────────────────────────┘
```

---

## Data Model (EncryptedSharedPreferences)

| Key | Type | Description |
|-----|------|-------------|
| `backend_url` | String | Server URL (e.g. `https://api.sms-monitor.com`) |
| `api_key` | String | Per-device API key (raw, returned once on claim) |
| `device_id` | String | Device UUID (returned on claim) |
| `device_name` | String | User-editable device name (default: "SMS Monitor Device") |
| `workspace_id` | String | Workspace UUID (returned on claim) |
| `workspace_name` | String | Workspace name (returned on claim) |

All stored in `EncryptedSharedPreferences` using `AES256_SIV` key encryption and `AES256_GCM` value encryption.

---

## Error Handling

| Scenario | UX |
|----------|-----|
| QR scan failure (camera) | Show manual entry form |
| Claim network error | Retry button, timeout after 30s |
| Invalid claim code | Error message: "Invalid or expired claim code" |
| Server URL unreachable | Error message: "Cannot connect to server. Check the URL." |
| Duplicate claim (same code) | Error message: "This code has already been used" |
| Revoked device re-claim | Device reactivated (same public key) — treated as normal claim success |

### Revoked Device Reactivation

If a device was previously revoked and the user re-claims with the same public key, the backend reactivates the existing device record instead of creating a duplicate. The device status changes from `REVOKED` to `ACTIVE`, device info is updated, and the existing API key is returned. The user sees this as a normal successful claim.

---

## Cross-references

- Feature doc: [`docs/features/claim-codes.md`](./claim-codes.md)
- Feature doc: [`docs/features/devices.md`](./devices.md)
- Architecture: [`docs/architecture/v2.0-overview.md`](../architecture/v2.0-overview.md) — ADR-004 (QR + manual code onboarding)
- Backend claim endpoint: `POST /v1/claim-codes/claim`
- Android source: `app/.../ClaimService.kt`, `app/.../SettingsRepository.kt`
