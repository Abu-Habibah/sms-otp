# Feature: Device Identification

**Feature ID:** F-DEVICE-ID
**Status:** ✅ Implemented
**Last Updated:** 2026-06-15

---

## Overview

### Description

Device identification feature allows admins to visually identify physical devices from the web admin. Similar to Windows monitor identification, when triggered, the physical device shows a visual indicator (background color change, notification, or ring).

### Problem Solved

- Admins managing multiple devices need to identify which physical device corresponds to which entry in the list
- Useful for troubleshooting, device setup, and verifying correct device registration

### User Story

> As a tenant admin, I want to click "Identify" on a device in the web admin, so the physical device shows a visual indicator and I can confirm which device it is.

---

## Scope

### In Scope

- Web admin "Identify" button for each device
- Android app receives identification request
- Visual indicator on Android (background color flash, notification, ring)
- Identification status feedback to web admin

### Out of Scope

- Remote device control
- Device location tracking
- Audio/video calls to device

---

## Flow

```
[Web Admin]                          [Backend]                          [Android Device]
    │                                   │                                   │
    │ POST /v1/devices/:id/identify     │                                   │
    ├──────────────────────────────────▶│                                   │
    │                                   │ Store identification request      │
    │                                   │                                   │
    │                                   │ Device polls or receives push     │
    │                                   │                                   │
    │                                   │ GET /v1/devices/:id/identify      │
    │                                   │◀──────────────────────────────────┤
    │                                   │                                   │
    │                                   │ Return identification data        │
    │                                   │                                   │
    │                                   │▶──────────────────────────────────┤
    │                                   │                                   │
    │                                   │                                   │ Show indicator
    │                                   │                                   │ (color, notification, ring)
    │                                   │                                   │
    │                                   │ POST /v1/devices/:id/identify/ack │
    │                                   │◀──────────────────────────────────┤
    │                                   │                                   │
    │◀──────────────────────────────────┤                                   │
    │                                   │                                   │
    │ Show "Device identified"          │                                   │
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/devices/:id/identify` | JWT, OWNER/ADMIN | Trigger identification |
| GET | `/v1/devices/:id/identify` | API key (DEVICE) | Check for identification request |
| POST | `/v1/devices/:id/identify/ack` | API key (DEVICE) | Acknowledge identification |

---

## Data Model

```prisma
model Device {
  // ... existing fields
  identifyRequestedAt DateTime?  // When identification was requested
  identifyAckedAt     DateTime?  // When device acknowledged
}
```

---

## Android Implementation

### Identification Modes

1. **Background Color Flash** — Change activity background to bright color for 5 seconds
2. **Notification** — Show high-priority notification with custom sound
3. **Ring** — Play ringtone for 5 seconds

### Files to Modify

- `app/src/main/java/com/smsmonitor/app/service/DeviceIdentificationService.kt` (new)
- `app/src/main/java/com/smsmonitor/app/service/HeartbeatService.kt` (add identification check)
- `app/src/main/java/com/smsmonitor/app/MainActivity.kt` (add identification handler)

---

## Web Admin Changes

### Device List Actions

Add "Identify" button to device actions:
- Only shown for ACTIVE devices
- Shows loading state while waiting for acknowledgment
- Shows success when device acknowledges

### Device Detail Modal

Show identification history:
- Last identified at
- Acknowledged at

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | Admin can click "Identify" button on device |
| AC-2 | Backend stores identification request |
| AC-3 | Android app checks for identification on heartbeat |
| AC-4 | Android shows visual indicator (background color flash) |
| AC-5 | Android acknowledges identification |
| AC-6 | Web admin shows identification status |

---

## Cross-references

- Feature: `docs/features/devices.md`
- Feature: `docs/features/device-information.md`
