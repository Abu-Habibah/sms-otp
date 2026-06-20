# Feature: Device Information

**Feature ID:** F-DEVICE-INFO
**Status:** ✅ Implemented
**Last Updated:** 2026-06-15

---

## Overview

### Description

Enhance device information to include detailed hardware specs like SIM card numbers, smartphone model, manufacturer, OS version, and app version. This information is collected during the claim process and stored in the device record.

### Problem Solved

- Currently devices show "Claimed Device" with minimal info
- Admins need to identify devices by model, SIM, or other hardware details
- Useful for troubleshooting and device management

### User Story

> As a tenant admin, I want to see detailed device information (model, SIM, OS version) so I can identify and manage devices effectively.

---

## Scope

### In Scope

- Collect device info during claim (manufacturer, model, OS version, app version)
- Add SIM card information fields
- Display detailed device info in web admin
- Update device info on heartbeat

### Out of Scope

- Device location tracking
- Device health monitoring
- Remote device configuration

---

## Data Model Changes

```prisma
model Device {
  // ... existing fields
  manufacturer   String?
  model          String?
  osVersion      String?
  appVersion     String?
  simSlot1Number String?    // NEW: SIM 1 phone number
  simSlot2Number String?    // NEW: SIM 2 phone number
  deviceModel    String?    // NEW: Full device model name
  androidVersion String?    // NEW: Android OS version
  lastHeartbeat  DateTime?  // NEW: Last heartbeat timestamp
}
```

---

## API Changes

### POST /v1/claim-codes/claim

**Request (addition):**
```json
{
  "code": "XYZ12345",
  "publicKey": "...",
  "deviceInfo": {
    "manufacturer": "Samsung",
    "model": "Galaxy S24",
    "osVersion": "14",
    "appVersion": "2.0",
    "simSlot1Number": "+1234567890",
    "simSlot2Number": "+0987654321",
    "androidVersion": "14"
  }
}
```

### POST /v1/devices/:id/heartbeat

**Request (addition):**
```json
{
  "deviceInfo": {
    "osVersion": "14",
    "appVersion": "2.0",
    "simSlot1Number": "+1234567890"
  }
}
```

---

## Android Changes

### Collect Device Info

- Use `TelephonyManager` to get SIM numbers
- Use `Build` class to get model, manufacturer, OS version
- Include in claim request and heartbeat

### Files to Modify

- `app/src/main/java/com/smsmonitor/app/claim/ClaimCodeScannerActivity.kt`
- `app/src/main/java/com/smsmonitor/app/service/HeartbeatService.kt`
- `app/src/main/java/com/smsmonitor/util/DeviceInfoCollector.kt` (new)

---

## Web Admin Changes

### Device List Display

| Current | Proposed |
|---------|----------|
| Claimed Device | Samsung Galaxy S24 |
| 5213f378… | +1234567890 • Android 14 |

### Device Detail Modal

Show full device info:
- Device name
- SIM 1 number
- SIM 2 number
- Manufacturer
- Model
- OS version
- App version
- Last seen
- Created at

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | Device info includes manufacturer, model, OS version |
| AC-2 | SIM card numbers collected during claim |
| AC-3 | Device info updated on heartbeat |
| AC-4 | Web admin displays device model and SIM info |
| AC-5 | Device detail modal shows full info |

---

## Cross-references

- Feature: `docs/features/devices.md`
- Feature: `docs/features/claim-codes.md`
