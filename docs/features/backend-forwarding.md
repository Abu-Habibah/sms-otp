# Feature: Backend Forwarding

**Status:** ✅ Sprint 4 — implemented
**Feature ID:** F-003
**Last Updated:** 2026-06-09

## Overview

**Description:** Forward matching SMS to configurable backend endpoint via HTTP POST/GET with retry logic.

**User Story:** As a developer, I want SMS forwarded to my API so that I can process verification codes in my system.

---

## Scope

**In Scope:**
- Configurable endpoint URL (REST API or webhook)
- HTTP POST (primary) and GET methods
- Custom headers (Authorization, API keys, Content-Type)
- Exponential backoff retry (max 5 attempts)
- Background processing via WorkManager

**Out of Scope:**
- WebSocket connections
- Batch forwarding (multiple SMS in one request)
- Real-time streaming responses
- Multiple simultaneous endpoints

---

## OEM Compatibility

**Problem:** Aggressive OEM battery optimization (ColorOS, EMUI, MIUI) freezes WorkManager jobs, causing forwarding delays or failures.

**Current Mitigation:** Immediate in-process HTTP send in `SmsBroadcastReceiver` as primary path; WorkManager as retry fallback.

**Future Enhancements:**
| Enhancement | Priority | Effort | Status |
|-------------|----------|--------|--------|
| Foreground Service for Critical Forwarding | P1 | 1 day | Planned |
| Battery Optimization Exemption Prompt | P1 | 0.5 day | Planned |
| Certificate Pinning | P2 | 0.5 day | Planned |

See [Android Enhancements](./android-enhancements.md) for implementation details.

---

## E2E Flow: Backend Forwarding

```
[SMS Received + Keyword Match]
        │
        ▼
[Save to pending_forwards table]
        │ Status: PENDING
        │
        ▼
[Enqueue SmsForwardJob]
        │
        ▼
[WorkManager - Check constraints]
        │
        ├── Network available ──▶ [HTTP POST to endpoint]
        │                               │
        │                               ├── 2xx ──▶ [Move to logs, status=SUCCESS]
        │                               │
        │                               ├── 4xx ──▶ [Log error, status=FAILED, no retry]
        │                               │
        │                               └── 5xx ──▶ [Increment retry, schedule backoff]
        │
        └── Network unavailable ──▶ [Wait for connectivity, retry]
```

---

## Request Format

**POST /sms/forward**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sender": "+1234567890",
  "message": "Your verification code is 123456",
  "matchedKeyword": "verification",
  "deviceId": "android-a1b2c3d4-e5f6-7890",
  "deviceAlias": "My Phone"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-Device-ID: <device-uuid>
```

---

## Retry Policy

| Attempt | Delay | Cumulative |
|---------|-------|------------|
| 1 | 1 second | 1s |
| 2 | 2 seconds | 3s |
| 3 | 4 seconds | 7s |
| 4 | 8 seconds | 15s |
| 5 | 16 seconds | 31s |
| Fail | - | Move to FAILED |

---

## Error Handling

| HTTP Status | Action | Retry |
|-------------|--------|-------|
| 200-299 | Success | No |
| 400-499 | Client error | No |
| 500-599 | Server error | Yes |
| Timeout | Network error | Yes |
| No network | Connectivity | Yes |

---

## Related Documentation

- [SMS Monitoring](./sms-monitoring.md) — How SMS are intercepted and trigger forwarding
- [Keyword Configuration](./keyword-configuration.md) — How keywords determine which SMS to forward
- [Forwarding Logs](./forwarding-logs.md) — How forwarding history is tracked
- [Settings Configuration](./settings-configuration.md) — How to configure endpoint URL and API keys
- [System Overview](../architecture/system-overview.md) — High-level architecture

## Dependencies

- Retrofit + OkHttp (HTTP client)
- WorkManager (background processing)
- Room (pending_forwards queue)

## Status History

| Date | Status | Notes |
|------|--------|-------|
| 2026-06-05 | Planned | Initial definition |
