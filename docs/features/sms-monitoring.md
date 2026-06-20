# Feature: SMS Monitoring

**Status:** ✅ Sprint 4 — implemented
**Feature ID:** F-001
**Last Updated:** 2026-06-09

## Overview

**Description:** Continuously listen for incoming SMS without foreground notification, extract sender and message content for processing.

**Problem Solved:** Users need to passively capture SMS messages for forwarding or backup purposes without manual intervention.

**User Story:** As a system administrator, I want the app to silently monitor incoming SMS so that I can capture verification codes automatically.

---

## Scope

### In Scope
- BroadcastReceiver registration for SMS events
- Runtime permission handling (RECEIVE_SMS)
- Multi-part SMS reassembly (up to 10 parts within 5-second window)
- Dual SIM support (primary SIM only for MVP)
- SMS_ID generation for deduplication (SHA256 of sender+timestamp)

### Out of Scope
- Outgoing SMS handling
- SMS deletion/modification
- Contact management
- SMS from specific contacts only

---

## Dual SIM Policy

**Decision:** One Device, Both SIMs → Same Tenant (Option A)

A physical device with dual SIM cards is treated as a **single device**. Both SIM slots forward SMS to the **same tenant** using the same keyword configuration.

```
┌─────────────┐         ┌─────────────┐
│   Tenant    │ 1─────1 │   Device    │
├─────────────┤         ├─────────────┤
│ id: "T1"    │         │ id: "D1"    │
│ keywords: [...]       │ tenantId: T1│
└─────────────┘         └─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ SIM 1    │ SIM 2  │
                    │ → T1     │ → T1   │
```

**Rationale:**
- Simplest to implement and understand
- Most common use case: one phone, one organization
- Users needing different tenants per SIM can use two physical devices

**Future:** Per-SIM tenant routing deferred to v3+ if demand materializes.

---

## Future Enhancements

See [Android Enhancements](./android-enhancements.md) for planned improvements:

| Enhancement | Priority | Effort | Status |
|-------------|----------|--------|--------|
| Enhanced Multi-Part SMS Reassembly (10-part, 5s window) | P2 | 1 day | Planned |
| Dual SIM Support (detect SIM slot, include in payload) | P2 | 1 day | Planned |
| Foreground Service for Critical Forwarding | P1 | 1 day | Planned |
| Battery Optimization Exemption Prompt | P1 | 0.5 day | Planned |

---

## E2E Flow

```
[External/Carrier SMS]
        │
        ▼
[Android System - SMS_RECEIVED Intent]
        │
        ▼
[SmsBroadcastReceiver]
        │
        ▼
[Extract: sender, body, timestamp]
        │
        ▼
[Generate SMS_ID (SHA256 hash)]
        │
        ▼
[Check pending_forwards for duplicates]
        │
        ├── Duplicate ──▶ [Discard]
        │
        └── New ──▶ [Keyword Matching Engine]
                   │
                   ▼
            [Forwarding Service]
```

---

## Implementation Details

### Android Implementation

```kotlin
class SmsBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        for (message in Telephony.Sms.Intents.getMessagesFromIntent(intent)) {
            val sms = SmsMessage(
                sender = message.originatingAddress,
                body = message.messageBody,
                timestamp = System.currentTimeMillis(),
                smsId = generateSmsId(message.originatingAddress, message.timestamp)
            )
            // Send to KeywordEngine via DI
            ProcessLifecycleOwner.get().lifecycleScope.launch {
                keywordEngine.process(sms)
            }
        }
    }

    private fun generateSmsId(sender: String, timestamp: Long): String {
        val input = "$sender:$timestamp"
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
```

### Permissions Required

```xml
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" /> <!-- Android 13+ -->
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Permission denied | Show explanation dialog, disable monitoring |
| Multi-part SMS | Reassemble using pdus within 5s window |
| App killed by system | WorkManager continues processing pending |
| Very long SMS (>10 parts) | Process first 10, log warning |
| Invalid PDU | Skip corrupted message, log error |
| Dual SIM | Use first valid SIM slot |

---

## QA/Test Scenarios

```gherkin
Scenario: Normal SMS received with matching keyword
  Given monitoring is enabled
    And permission is granted
  When SMS received with content "Your OTP is 123456"
  Then message is forwarded to configured endpoint

Scenario: SMS from system number
  Given monitoring is enabled
  When SMS received from carrier system number
  Then message is silently ignored

Scenario: Multi-part SMS received
  Given monitoring is enabled
  When long SMS split into 3 parts arrives within 5 seconds
  Then all parts are reassembled into single message
  And message is processed once

Scenario: Duplicate SMS received
  Given SMS with ID "abc123" was already processed
  When same SMS ID received again
  Then message is silently ignored
```

---

## Related Documentation

- [Keyword Configuration](./keyword-configuration.md) — How matched keywords are evaluated
- [Backend Forwarding](./backend-forwarding.md) — How matched SMS are forwarded to your endpoint
- [Settings Configuration](./settings-configuration.md) — How to configure monitoring behavior
- [System Overview](../architecture/system-overview.md) — High-level architecture
- [Sprint Backlog](../sprints/backlog.md) — Implementation tasks

## Dependencies

- Platform-specific: Android BroadcastReceiver
- Kotlin Coroutines + Flow

## Risks

| Risk | Mitigation |
|------|------------|
| Doze mode prevents SMS reception | Request battery optimization exemption |
| Permission permanently denied | Graceful degradation with clear UI |
| Multi-part timing issues | 5-second assembly window with configurable timeout |

---

## Status History

| Date | Status | Notes |
|------|--------|-------|
| 2026-06-05 | Planned | Initial definition |
