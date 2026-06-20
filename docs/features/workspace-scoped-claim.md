# Feature: Workspace-Scoped Device Claim

**Feature ID:** F-WORKSPACE-CLAIM
**Status:** 🔲 Not started
**Last Updated:** 2026-06-13

---

## Overview

### Description

Device claim is moved from the Devices page to the Workspace page. When an admin generates a claim code, it's scoped to a specific workspace. The Android device claims into that workspace, and keyword sync is automatically scoped to the workspace.

### Problem Solved

- Device claim on Devices page has no workspace context
- Keyword sync returns all tenant keywords, not workspace-scoped
- Admin doesn't explicitly choose which workspace gets the device

### User Story

> As a tenant admin, I want to add a device to a specific workspace, so that it only monitors keywords configured for that workspace.

---

## Current vs Proposed Flow

### Current (Broken)

```
Devices page → Generate claim code → QR → Android claims
                                            ↓
                              Device gets workspaceId from claim code
                                            ↓
                              KeywordSyncService → GET /v1/keywords
                                            ↓
                              ❌ Returns ALL tenant keywords (not workspace-scoped)
```

### Proposed (Correct)

```
Workspace page → Select workspace → Generate claim code → QR → Android claims into workspace
                                                                      ↓
                                                      Device linked to workspace
                                                                      ↓
                                                      KeywordSyncService → GET /v1/keywords?workspaceId=WS123
                                                                      ↓
                                                      ✅ Returns only workspace keywords
```

---

## Backend Changes

### 1. Claim Response (devices.service.ts)

**Current:**
```typescript
return {
  device: { id, name, status, createdAt },
  apiKey,
  serverUrl
};
```

**Proposed:**
```typescript
return {
  device: { id, name, status, createdAt, workspaceId, workspaceName },
  apiKey,
  serverUrl
};
```

### 2. ApiKeyAuthGuard (api-key-auth.guard.ts)

**Add workspaceId to context:**
```typescript
req.deviceId = device.id;
req.tenantId = device.tenantId;
req.workspaceId = device.workspaceId;  // NEW
req.userId = device.id;
req.role = 'DEVICE';
```

### 3. Keyword Sync Endpoint (keywords.controller.ts)

**Filter by workspaceId when device context present:**
```typescript
@Get()
async list() {
  const ctx = getTenantContext();
  const workspaceId = ctx.workspaceId;  // From device or user context
  return this.keywords.list(workspaceId);
}
```

### 4. Keyword Service (keywords.service.ts)

**Filter by workspaceId:**
```typescript
async list(workspaceId?: string) {
  const where = workspaceId ? { workspaceId } : {};
  return this.prisma.keyword.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## Android Changes

### 1. QR Payload Format

**Current:**
```
http://be:3000/v1/claim?code=XYZ12345
```

**Proposed:**
```
http://be:3000/v1/claim?code=XYZ12345&workspaceId=WS123
```

### 2. ClaimCodeScannerActivity.kt

**Extract workspaceId from QR:**
```kotlin
val uri = Uri.parse(qrContent)
val code = uri.getQueryParameter("code")
val workspaceId = uri.getQueryParameter("workspaceId")
```

### 3. ManualCodeEntryActivity.kt

**Optional workspaceId input:**
```kotlin
// Workspace ID is optional (can be pre-filled from QR or manual)
val workspaceId = workspaceIdInput.text.toString().takeIf { it.isNotBlank() }
```

### 4. ClaimService.kt

**Send workspaceId in claim request:**
```kotlin
data class ClaimRequest(
  val code: String,
  val workspaceId: String? = null  // NEW
)
```

### 5. ClaimResponse.kt

**Parse workspaceId from response:**
```kotlin
data class ClaimResponse(
  val apiKey: String,
  val device: ClaimDevice,
  val workspaceId: String?,    // NEW
  val workspaceName: String?   // NEW
)
```

### 6. KeywordSyncService.kt

**Add workspaceId to request:**
```kotlin
val workspaceId = settingsRepository.workspaceId
val url = if (workspaceId != null) {
  "$baseUrl/v1/keywords?workspaceId=$workspaceId"
} else {
  "$baseUrl/v1/keywords"
}
```

---

## Web Admin Changes

### 1. Workspace Detail Page

**Add "Add Device" button:**
```
┌─────────────────────────────────────────────────────────┐
│ Workspace: HR Department                                │
├─────────────────────────────────────────────────────────┤
│ [Devices] [Keywords] [Members] [Settings]               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ + Add Device                                     │   │
│  │                                                 │   │
│  │ This will generate a claim code for this         │   │
│  │ workspace. The device will be linked to          │   │
│  │ HR Department and use its keywords.              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. DevicesTab.tsx

**Add claim code generation:**
```tsx
function DevicesTab({ workspaceId, workspaceName }) {
  return (
    <div>
      <Button onClick={() => setShowClaimModal(true)}>
        + Add Device
      </Button>
      
      <GenerateCodeModal
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        // ... other props
      />
      
      <DeviceList workspaceId={workspaceId} />
    </div>
  );
}
```

### 3. GenerateCodeModal.tsx

**Include workspaceId in QR:**
```tsx
const qrPayload = `${publicApiUrl}/v1/claim?code=${generatedCode}&workspaceId=${workspaceId}`;
```

### 4. Devices Page (simplified)

**Option A: Remove claim modal entirely**
- Devices page only shows device list
- No "Generate Claim Code" button
- Admin must go to Workspace to add devices

**Option B: Keep but redirect**
- "Generate Claim Code" shows message: "Go to Workspace to add devices"
- Links to workspace list

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN WORKFLOW                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Go to /workspaces                                          │
│  2. Select workspace (e.g., "HR Department")                   │
│  3. Click "Devices" tab                                        │
│  4. Click "+ Add Device"                                       │
│  5. Modal shows QR code with:                                  │
│     http://api.example.com/v1/claim?code=XYZ&workspaceId=WS123 │
│  6. Admin shows QR to device user                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DEVICE CLAIM WORKFLOW                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Android app scans QR                                       │
│  2. Extracts: code=XYZ, workspaceId=WS123                      │
│  3. Calls POST /v1/claim-codes/claim                           │
│     Body: { code: "XYZ", publicKey: "...", workspaceId: "WS123" }│
│  4. Backend creates device with workspaceId=WS123              │
│  5. Response: { deviceId, apiKey, workspaceId, workspaceName }  │
│  6. Android stores: deviceId, apiKey, workspaceId, workspaceName│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  KEYWORD SYNC WORKFLOW                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Android calls GET /v1/keywords?workspaceId=WS123           │
│  2. Backend filters: WHERE workspaceId = 'WS123'               │
│  3. Returns only HR Department keywords                        │
│  4. Android syncs to local Room database                       │
│  5. SMS matching uses workspace-scoped keywords                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | Workspace detail page has "Add Device" button |
| AC-2 | Claim code modal includes workspaceId in QR payload |
| AC-3 | QR format: `{serverUrl}/v1/claim?code={code}&workspaceId={id}` |
| AC-4 | Android extracts workspaceId from QR |
| AC-5 | Claim request sends workspaceId |
| AC-6 | Claim response includes workspaceId, workspaceName |
| AC-7 | Device created with correct workspaceId |
| AC-8 | Keyword sync filters by workspaceId |
| AC-9 | Device only matches workspace keywords |
| AC-10 | Devices page no longer has claim modal (optional) |

---

## Implementation Files

| Layer | Files |
|-------|-------|
| Backend | `devices.service.ts`, `api-key-auth.guard.ts`, `keywords.service.ts`, `keywords.controller.ts` |
| Android | `ClaimCodeScannerActivity.kt`, `ManualCodeEntryActivity.kt`, `ClaimService.kt`, `KeywordSyncService.kt`, `SettingsRepository.kt` |
| Web | `workspace/[id]/tabs/DevicesTab.tsx`, `workspace/[id]/page.tsx`, `devices/DevicesClient.tsx` |

---

## Cross-references

- Sprint: `docs/sprints/v2.0/sprint-9-workspaces.md`
- Feature: `docs/features/workspaces.md`
- Feature: `docs/features/claim-codes.md`
- Feature: `docs/features/keyword-sync-heartbeat.md`
