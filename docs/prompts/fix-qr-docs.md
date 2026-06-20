# Prompt: Fix QR Code Documentation Inconsistencies

## Task

Update documentation to match actual QR code implementation. The current docs have inconsistencies about the QR payload format.

---

## Inconsistencies Found

| Document | Current Format | Actual Format |
|----------|----------------|---------------|
| `docs/features/claim-codes.md` | `${PUBLIC_API_BASE_URL}/v1/claim?code=${code}` | `${publicApiUrl}/v1/claim?code=${code}&workspaceId=${workspaceId}` |
| `docs/features/device-onboarding.md` | `<serverUrl>/v1/claim?code=<claimCode>` | `<serverUrl>/v1/claim?code=<claimCode>&workspaceId=<workspaceId>` |
| `docs/sprints/v2.0/sprint-2-devices-claim-codes.md` | `/v1/claim/{code}` (path param) | `/v1/claim?code=${code}` (query param) |

---

## Actual Implementation

### Web Admin (web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx)
```typescript
const qrPayload = generatedCode
  ? `${tenantPublicApiUrl ?? ''}/v1/claim?code=${generatedCode}&workspaceId=${workspaceId}`
  : null;
```

### Android (app/src/main/java/com/smsmonitor/app/claim/ClaimCodeScannerActivity.kt)
```kotlin
private const val QR_CODE_REGEX = "^(https?://[^/]+)?/v1/claim\\?code=[A-Z0-9]{8}(&workspaceId=[^&]+)?$"
```

---

## Files to Update

1. `docs/features/claim-codes.md`
2. `docs/features/device-onboarding.md`
3. `docs/sprints/v2.0/sprint-2-devices-claim-codes.md`

---

## Implementation

### 1. docs/features/claim-codes.md

Update the QR format description:

```
Before: The QR encodes the URL `<apiBaseUrl>/v1/claim?code=<code>`

After: The QR encodes the URL `${publicApiUrl}/v1/claim?code=${code}&workspaceId=${workspaceId}`
```

Update AC-3:

```
Before: The `qrPayload` is the URL `${PUBLIC_API_BASE_URL}/v1/claim?code=${code}`

After: The `qrPayload` is the URL `${publicApiUrl}/v1/claim?code=${code}&workspaceId=${workspaceId}`
```

### 2. docs/features/device-onboarding.md

Update QR payload format:

```
Before: QR payload format: `<serverUrl>/v1/claim?code=<claimCode>`

After: QR payload format: `<serverUrl>/v1/claim?code=<claimCode>&workspaceId=<workspaceId>`
```

Add workspaceId to the extracted parameters list.

### 3. docs/sprints/v2.0/sprint-2-devices-claim-codes.md

Update D5 decision:

```
Before: (a) Plain URL `https://api.sms-monitor.example/v1/claim/{code}`

After: (a) Plain URL `https://api.sms-monitor.example/v1/claim?code={code}&workspaceId={workspaceId}`
```

---

## Verification

After updating, verify:
- All QR format references use query params (not path params)
- All QR format references include workspaceId
- Android regex matches the documented format

---

## Reference

- Actual code: `web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`
- Android code: `app/src/main/java/com/smsmonitor/app/claim/ClaimCodeScannerActivity.kt`
