# Prompt: Android Agent — QR Code Documentation Alignment

## Task

Verify Android code matches updated QR documentation and fix any gaps.

## Documentation Updated

- `docs/features/claim-codes.md` — QR format now includes `workspaceId`
- `docs/features/device-onboarding.md` — QR payload updated

## What to Verify

### 1. QR Code Parsing

**File:** `app/src/main/java/com/smsmonitor/app/claim/ClaimCodeScannerActivity.kt`

Verify the QR regex accepts `workspaceId`:

```kotlin
private const val QR_CODE_REGEX = "^(https?://[^/]+)?/v1/claim\\?code=[A-Z0-9]{8}(&workspaceId=[^&]+)?$"
```

### 2. QR Payload Extraction

Verify the code extracts `workspaceId` from the QR:

```kotlin
rawValue.matches(QR_CODE_REGEX.toRegex()) -> {
    val uri = android.net.Uri.parse(rawValue)
    val serverUrl = "${uri.scheme}://${uri.host}${if (uri.port > 0) ":${uri.port}" else ""}"
    val code = uri.getQueryParameter("code") ?: ""
    val workspaceId = uri.getQueryParameter("workspaceId")
    Triple(serverUrl, code, workspaceId)
}
```

### 3. Claim Request

**File:** `app/src/main/java/com/smsmonitor/data/repository/ClaimService.kt`

Verify the claim request includes `workspaceId`:

```kotlin
data class ClaimRequest(
    val code: String,
    val workspaceId: String? = null
)
```

### 4. Claim Response

Verify the claim response parses `workspaceId` and `workspaceName`:

```kotlin
data class ClaimResponse(
    val apiKey: String,
    val device: ClaimDevice,
    val workspaceId: String?,
    val workspaceName: String?
)
```

### 5. Settings Storage

**File:** `app/src/main/java/com/smsmonitor/data/repository/SettingsRepository.kt`

Verify `workspaceId` and `workspaceName` are stored:

```kotlin
var workspaceId: String?
    get() = securePrefs.getString(KEY_WORKSPACE_ID, null)
    set(value) = securePrefs.edit().putString(KEY_WORKSPACE_ID, value).apply()

var workspaceName: String?
    get() = securePrefs.getString(KEY_WORKSPACE_NAME, null)
    set(value) = securePrefs.edit().putString(KEY_WORKSPACE_NAME, value).apply()
```

## Acceptance Criteria

- [ ] QR regex accepts workspaceId parameter
- [ ] QR parsing extracts workspaceId from URL
- [ ] Claim request includes workspaceId
- [ ] Claim response parses workspaceId, workspaceName
- [ ] Settings stores workspaceId, workspaceName
- [ ] App builds without errors

## Reference

- Documentation: `docs/features/claim-codes.md`
- Documentation: `docs/features/device-onboarding.md`
- Feature spec: `docs/features/workspace-scoped-claim.md`
