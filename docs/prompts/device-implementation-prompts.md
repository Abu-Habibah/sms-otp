# Device Implementation Prompts

## Prompt 1: Backend Agent — Device Information

```
TASK: Implement Device Information Enhancement (Backend)

REFERENCE:
- Feature spec: docs/features/device-information.md
- Sprint plan: docs/sprints/v2.0/sprint-8-api-completion-cleanup.md

GOAL:
Enhance device model to include detailed hardware info and update claim/heartbeat endpoints.

IMPLEMENTATION STEPS:

1. DATABASE SCHEMA UPDATE
   File: backend/prisma/schema.prisma
   
   Add fields to Device model:
   - simSlot1Number String?
   - simSlot2Number String?
   - deviceModel String?
   - androidVersion String?
   - lastHeartbeat DateTime?

2. CLAIM ENDPOINT UPDATE
   File: backend/src/devices/devices.service.ts
   
   Update claim() method to accept and store deviceInfo:
   - manufacturer, model, osVersion, appVersion
   - simSlot1Number, simSlot2Number
   - androidVersion

3. HEARTBEAT ENDPOINT UPDATE
   File: backend/src/devices/devices.controller.ts
   File: backend/src/devices/devices.service.ts
   
   Update heartbeat() to:
   - Accept deviceInfo in request body
   - Update device record with latest info
   - Update lastHeartbeat timestamp

4. E2E TESTS
   File: backend/test/devices.e2e-spec.ts
   
   Add test cases:
   - Device info stored on claim
   - Device info updated on heartbeat
   - lastHeartbeat timestamp updated

ACCEPTANCE CRITERIA:
- [ ] Device model includes SIM numbers, model, OS version
- [ ] Claim request accepts deviceInfo
- [ ] Heartbeat request accepts deviceInfo
- [ ] Device info stored in database
- [ ] lastHeartbeat updated on heartbeat

MUST DO:
- Follow existing patterns in devices.service.ts
- Use TenantScopedPrismaService for queries
- Handle null/undefined deviceInfo fields

MUST NOT DO:
- Do NOT break existing claim/heartbeat flows
- Do NOT require deviceInfo fields (all optional)
```

---

## Prompt 2: Android Agent — Device Information Collection

```
TASK: Implement Device Information Collection (Android)

REFERENCE:
- Feature spec: docs/features/device-information.md
- Sprint plan: docs/sprints/v2.0/sprint-8-api-completion-cleanup.md

GOAL:
Collect device hardware info and send during claim and heartbeat.

IMPLEMENTATION STEPS:

1. CREATE DeviceInfoCollector
   File: app/src/main/java/com/smsmonitor/util/DeviceInfoCollector.kt (new)
   
   Utility class to collect:
   - Build.MANUFACTURER
   - Build.MODEL
   - Build.DEVICE
   - Build.VERSION.RELEASE (Android version)
   - Build.VERSION.SDK_INT
   - TelephonyManager.getLine1Number() (SIM 1)
   - TelephonyManager.getSimSerialNumber() (SIM 2 if available)
   - App version from BuildConfig

2. UPDATE ClaimService
   File: app/src/main/java/com/smsmonitor/data/repository/ClaimService.kt
   
   Update ClaimRequest to include deviceInfo:
   data class ClaimRequest(
     val code: String,
     val publicKey: String,
     val deviceInfo: DeviceInfo? = null
   )

3. UPDATE ClaimCodeScannerActivity
   File: app/src/main/java/com/smsmonitor/app/claim/ClaimCodeScannerActivity.kt
   
   Collect device info before claim request

4. UPDATE HeartbeatService
   File: app/src/main/java/com/smsmonitor/app/service/HeartbeatService.kt
   
   Include device info in heartbeat request

ACCEPTANCE CRITERIA:
- [ ] DeviceInfoCollector collects all hardware info
- [ ] Claim request includes deviceInfo
- [ ] Heartbeat request includes deviceInfo
- [ ] App builds without errors

MUST DO:
- Use DeviceInfoCollector utility
- Handle permission issues (SIM info may require READ_PHONE_STATE)
- Include app version from BuildConfig

MUST NOT DO:
- Do NOT crash if SIM info unavailable
- Do NOT require permissions that might be denied
```

---

## Prompt 3: Backend Agent — Device Identification

```
TASK: Implement Device Identification (Backend)

REFERENCE:
- Feature spec: docs/features/device-identification.md
- Sprint plan: docs/sprints/v2.0/sprint-8-api-completion-cleanup.md

GOAL:
Add device identification feature for admin to visually identify physical devices.

IMPLEMENTATION STEPS:

1. DATABASE SCHEMA UPDATE
   File: backend/prisma/schema.prisma
   
   Add fields to Device model:
   - identifyRequestedAt DateTime?
   - identifyAckedAt DateTime?

2. IDENTIFICATION ENDPOINTS
   File: backend/src/devices/devices.controller.ts
   File: backend/src/devices/devices.service.ts
   
   Add endpoints:
   - POST /v1/devices/:id/identify (admin triggers)
   - GET /v1/devices/:id/identify (device checks)
   - POST /v1/devices/:id/identify/ack (device acknowledges)

3. IDENTIFICATION SERVICE
   File: backend/src/devices/devices.service.ts
   
   Methods:
   - triggerIdentification(deviceId) - sets identifyRequestedAt
   - checkIdentification(deviceId) - returns identification request
   - acknowledgeIdentification(deviceId) - sets identifyAckedAt

4. E2E TESTS
   File: backend/test/devices.e2e-spec.ts
   
   Test cases:
   - Admin triggers identification
   - Device checks for identification
   - Device acknowledges identification
   - Identification status updated

ACCEPTANCE CRITERIA:
- [ ] POST /v1/devices/:id/identify triggers identification
- [ ] GET /v1/devices/:id/identify returns identification request
- [ ] POST /v1/devices/:id/identify/ack acknowledges
- [ ] Web admin shows identification status

MUST DO:
- Use existing device endpoints patterns
- Add identification fields to Device model
- Handle cross-tenant access (404)

MUST NOT DO:
- Do NOT break existing device endpoints
- Do NOT require device to acknowledge (optional)
```

---

## Prompt 4: Android Agent — Device Identification

```
TASK: Implement Device Identification (Android)

REFERENCE:
- Feature spec: docs/features/device-identification.md
- Sprint plan: docs/sprints/v2.0/sprint-8-api-completion-cleanup.md

GOAL:
Android app responds to identification requests with visual indicator.

IMPLEMENTATION STEPS:

1. CREATE DeviceIdentificationService
   File: app/src/main/java/com/smsmonitor/app/service/DeviceIdentificationService.kt (new)
   
   Foreground service that:
   - Checks for identification request on heartbeat
   - Shows visual indicator when triggered
   - Acknowledges identification

2. IDENTIFICATION MODES
   - Background color flash (5 seconds)
   - High-priority notification
   - Ringtone playback

3. UPDATE HeartbeatService
   File: app/src/main/java/com/smsmonitor/app/service/HeartbeatService.kt
   
   After heartbeat, check for identification request

4. UPDATE AndroidManifest.xml
   File: app/src/main/AndroidManifest.xml
   
   Add permissions:
   - VIBRATE (for notification)
   - READ_PHONE_STATE (for SIM info if needed)

ACCEPTANCE CRITERIA:
- [ ] Device checks identification on heartbeat
- [ ] Visual indicator shown when triggered
- [ ] Identification acknowledged
- [ ] App builds without errors

MUST DO:
- Create DeviceIdentificationService
- Integrate with HeartbeatService
- Handle identification gracefully

MUST NOT DO:
- Do NOT crash if identification fails
- Do NOT require user interaction
```

---

## Prompt 5: Web Admin Agent — Device Identification UI

```
TASK: Implement Device Identification UI (Web Admin)

REFERENCE:
- Feature spec: docs/features/device-identification.md
- Sprint plan: docs/sprints/v2.0/sprint-8-api-completion-cleanup.md

GOAL:
Add "Identify" button to device list and show identification status.

IMPLEMENTATION STEPS:

1. UPDATE DevicesClient
   File: web/app/(dashboard)/devices/DevicesClient.tsx
   
   Add "Identify" button:
   - Only shown for ACTIVE devices
   - Calls POST /v1/devices/:id/identify
   - Shows loading state
   - Shows success when acknowledged

2. UPDATE DevicesTab (workspace)
   File: web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx
   
   Same identify functionality

3. IDENTIFICATION STATUS
   - Show "Identifying..." while waiting
   - Show "Identified" when acknowledged
   - Show last identified time

ACCEPTANCE CRITERIA:
- [ ] "Identify" button on ACTIVE devices
- [ ] Button triggers identification
- [ ] Loading state shown
- [ ] Success shown when acknowledged

MUST DO:
- Add identify button to device actions
- Handle loading and success states
- Only show for ACTIVE devices

MUST NOT DO:
- Do NOT break existing device actions
- Do NOT show identify for REVOKED devices
```

---

## Prompt 6: Backend Agent — Device Information & Identification Combined

```
TASK: Implement Device Information + Identification (Backend)

REFERENCE:
- Feature spec: docs/features/device-information.md
- Feature spec: docs/features/device-identification.md

GOAL:
Implement both device information enhancement and identification feature.

IMPLEMENTATION STEPS:

1. SCHEMA UPDATE
   File: backend/prisma/schema.prisma
   
   Add to Device model:
   - simSlot1Number String?
   - simSlot2Number String?
   - deviceModel String?
   - androidVersion String?
   - lastHeartbeat DateTime?
   - identifyRequestedAt DateTime?
   - identifyAckedAt DateTime?

2. CLAIM ENDPOINT
   File: backend/src/devices/devices.service.ts
   
   Update claim() to accept and store deviceInfo

3. HEARTBEAT ENDPOINT
   File: backend/src/devices/devices.service.ts
   
   Update heartbeat() to accept deviceInfo and update lastHeartbeat

4. IDENTIFICATION ENDPOINTS
   File: backend/src/devices/devices.controller.ts
   
   Add:
   - POST /v1/devices/:id/identify
   - GET /v1/devices/:id/identify
   - POST /v1/devices/:id/identify/ack

5. E2E TESTS
   File: backend/test/devices.e2e-spec.ts
   
   Add tests for both features

ACCEPTANCE CRITERIA:
- [ ] Device model includes all new fields
- [ ] Claim accepts deviceInfo
- [ ] Heartbeat accepts deviceInfo
- [ ] Identification endpoints work
- [ ] E2e tests pass

MUST DO:
- Combine both features in one implementation
- Follow existing patterns
- Handle null/undefined fields

MUST NOT DO:
- Do NOT break existing endpoints
- Do NOT require new fields
```
