# Feature: Android Enhancements

**Status:** ✅ Sprint 5-7 — implemented
**Feature ID:** F-006
**Last Updated:** 2026-06-11

## Overview

**Description:** Security, performance, and architecture improvements for the Android client to prepare for v2.0 multi-tenant SaaS and production deployment.

**User Story:** As a system administrator, I want a secure, reliable Android app that works consistently across device manufacturers so that SMS forwarding is dependable.

---

## Scope

### In Scope
- Certificate pinning for HTTP connections
- Encrypted storage for API keys and sensitive data
- Foreground service for critical SMS forwarding
- Battery optimization exemption guidance
- Enhanced multi-part SMS reassembly
- Dual SIM support
- Jetpack Compose migration (optional, per-project)
- Modular architecture split
- Comprehensive testing suite

### Out of Scope
- Outgoing SMS monitoring
- Filter by specific contacts
- App Lock / biometric authentication
- WebSocket connections
- Batch SMS forwarding

---

## 1. Security Enhancements

### 1.1 Certificate Pinning

**Priority:** P2 (after v2.0 migration)
**Effort:** 0.5 day

**Description:** Prevent Man-in-the-Middle (MITM) attacks by pinning the backend's TLS certificate.

**Implementation:**
```kotlin
// network_security_config.xml
<network-security-config>
    <domain-config>
        <domain includeSubdomains="true">api.smsmonitor.com</domain>
        <pin-set expiration="2027-01-01">
            <pin digest="SHA-256">-base64-encoded-public-key=</pin>
            <pin digest="SHA-256">-backup-key=</pin>
        </pin-set>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

**Acceptance Criteria:**
- [ ] App rejects connections with unpinned certificates
- [ ] Backup pin prevents lockout on certificate rotation
- [ ] Expiration date allows graceful rotation
- [ ] Debug builds can bypass pinning for testing

---

### 1.2 EncryptedSharedPreferences

**Priority:** P1
**Effort:** 0.5 day

**Description:** Encrypt API keys and sensitive configuration data at rest using AndroidX Security library.

**Implementation:**
```kotlin
// Before (plain text):
val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
prefs.edit().putString("api_key", apiKey).apply()

// After (encrypted):
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()
val securePrefs = EncryptedSharedPreferences.create(
    context,
    "secure_settings",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
securePrefs.edit().putString("api_key", apiKey).apply()
```

**Acceptance Criteria:**
- [ ] API key encrypted at rest
- [ ] Backend URL encrypted at rest
- [ ] Migration path from plain SharedPreferences
- [ ] No performance degradation on read/write

---

## 2. Performance & Reliability

### 2.1 Foreground Service for Critical Forwarding

**Priority:** P1
**Effort:** 1 day

**Description:** Ensure SMS forwarding survives OEM battery optimization by running as a foreground service with a persistent notification.

**Problem Solved:** Aggressive OEMs (ColorOS, EMUI, MIUI) freeze background processes. WorkManager alone is unreliable for time-sensitive SMS forwarding.

**Implementation:**
```kotlin
class ForwardingService : ForegroundService() {
    companion object {
        const val CHANNEL_ID = "sms_forwarding"
        const val NOTIFICATION_ID = 1
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMS Monitor")
            .setContentText("Forwarding SMS messages...")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .build()
        startForeground(NOTIFICATION_ID, notification)
        // Process forwarding queue
        return START_STICKY
    }
}
```

**Acceptance Criteria:**
- [ ] Foreground service starts when SMS is captured
- [ ] Persistent notification shows forwarding status
- [ ] Service survives OEM battery optimization
- [ ] Service stops after queue is empty

---

### 2.2 Battery Optimization Exemption Prompt

**Priority:** P1
**Effort:** 0.5 day

**Description:** Guide users to whitelist the app from Doze mode and standby buckets.

**Implementation:**
```kotlin
fun requestBatteryExemption(activity: Activity) {
    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
    intent.data = Uri.parse("package:${activity.packageName}")
    activity.startActivity(intent)
}

fun isIgnoringBatteryOptimizations(context: Context): Boolean {
    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return pm.isIgnoringBatteryOptimizations(context.packageName)
}
```

**Acceptance Criteria:**
- [ ] Prompt shown on first launch if not exempt
- [ ] Settings link in app Settings screen
- [ ] Status indicator shows exemption state
- [ ] Graceful fallback if user denies

---

## 3. SMS Processing Enhancements

### 3.1 Enhanced Multi-Part SMS Reassembly

**Priority:** P2
**Effort:** 1 day

**Description:** Properly reassemble long SMS messages split across multiple parts.

**Current State:** Basic concatenation in `SmsBroadcastReceiver.onReceive()`

**Enhancement:**
- Support up to 10 parts within 5-second window
- Handle out-of-order parts using sequence numbers
- Timeout and process partial reassembly if window expires

**Acceptance Criteria:**
- [ ] 10-part SMS reassembled correctly
- [ ] Out-of-order parts handled
- [ ] 5-second timeout processes partial
- [ ] Dedup by `(sender, timestamp)` to prevent duplicate processing

---

### 3.2 Dual SIM Support

**Priority:** P2
**Effort:** 1 day

**Description:** Detect which SIM slot received the SMS and include it in the forwarding payload.

**Policy:** One Device, Both SIMs → Same Tenant. Both SIM slots forward to the same tenant using the same keyword configuration.

**Current State:** Primary SIM only (MVP)

**Implementation:**
```kotlin
// Detect SIM slot from SMS
val subscriptionId = message.subsc
val simSlot = SubscriptionManager.getSlotIndex(subscriptionId)

// Include in payload
data class SmsForwardPayload(
    val timestamp: String,
    val sender: String,
    val message: String,
    val matchedKeyword: String,
    val deviceId: String,
    val deviceAlias: String,
    val simSlot: Int  // 0 = SIM 1, 1 = SIM 2
)
```

**Acceptance Criteria:**
- [ ] Detect originating SIM slot from incoming SMS
- [ ] Include `simSlot` in forwarding payload
- [ ] Store `simSlot` in SmsLog for debugging
- [ ] Both SIMs use same keyword configuration
- [ ] Both SIMs forward to same tenant

---

## 4. Architecture Improvements

### 4.1 Jetpack Compose Migration

**Priority:** P2
**Effort:** 3-5 days

**Description:** Migrate from XML layouts + View Binding to Jetpack Compose for modern declarative UI.

**Benefits:**
- 40-60% less UI code
- Declarative state management
- Better preview/testing support
- Material 3 (Material You) design system
- Dark mode/theme switching out of the box

**Migration Path:**
1. Add Compose dependencies
2. Migrate Settings screen (simplest)
3. Migrate Keywords screen (medium complexity)
4. Migrate Logs screen (medium complexity)
5. Migrate Main Dashboard (highest complexity)
6. Remove XML layouts

**Acceptance Criteria:**
- [ ] All screens migrated to Compose
- [ ] Material 3 design system applied
- [ ] Dark mode support
- [ ] No functional regressions

---

### 4.2 Modular Architecture Split

**Priority:** P3
**Effort:** 2-3 days

**Description:** Split monolithic `:app` module into focused modules for better separation of concerns and build performance.

**Proposed Structure:**
```
sms-monitor/
├── app/                    # UI layer (Activities, Compose)
├── core/                   # Common utilities, extensions
├── domain/                 # Business logic (services, models)
├── data/                   # Data layer (Room, repositories, API)
└── build-logic/            # Convention plugins
```

**Acceptance Criteria:**
- [ ] Clean module boundaries
- [ ] No circular dependencies
- [ ] Build time improvement (>20%)
- [ ] Independent module testing

---

## 5. Testing & Quality

### 5.1 Unit Test Suite

**Priority:** P2
**Effort:** 2-3 days

**Description:** Comprehensive unit tests for all business logic.

**Target Coverage:**
| Component | Target | Test Cases |
|-----------|--------|------------|
| `KeywordService` | 90% | Match modes, validation, CRUD |
| `SmsHttpSender` | 85% | Request formatting, error handling |
| `ForwardingRepository` | 85% | Upsert, prune, pending operations |
| `KeywordRepository` | 85% | CRUD, flow emissions |
| `SettingsRepository` | 80% | Persistence, defaults |

**Acceptance Criteria:**
- [ ] 80%+ unit test coverage
- [ ] All match modes tested
- [ ] Error paths covered
- [ ] CI gate enforced

---

### 5.2 Integration Tests

**Priority:** P2
**Effort:** 1-2 days

**Description:** Integration tests for Room database and WorkManager.

**Test Scenarios:**
- Room CRUD operations
- Room migrations
- WorkManager enqueue and execution
- WorkManager retry logic
- BroadcastReceiver → ViewModel flow

**Acceptance Criteria:**
- [ ] Room operations tested with real database
- [ ] WorkManager constraints tested
- [ ] End-to-end flow verified

---

### 5.3 UI Tests

**Priority:** P3
**Effort:** 1-2 days

**Description:** UI tests for critical user flows.

**Test Scenarios:**
- Keyword add/edit/delete flow
- Settings save/load flow
- Monitoring toggle flow
- Permission request flow

**Acceptance Criteria:**
- [ ] Critical flows covered
- [ ] Espresso/Compose Testing used
- [ ] No flaky tests

---

## Related Documentation

- [SMS Monitoring](./sms-monitoring.md) — SMS interception details
- [Backend Forwarding](./backend-forwarding.md) — HTTP forwarding
- [Keyword Configuration](./keyword-configuration.md) — Keyword management
- [System Overview](../architecture/system-overview.md) — High-level architecture
- [Build Toolchain](../architecture/build-toolchain.md) — Gradle/Kotlin versions
- [Future Backlog](../sprints/backlog.md) — Task IDs and priorities

## Dependencies

- AndroidX Security (EncryptedSharedPreferences)
- OkHttp CertificatePinner
- Jetpack Compose (optional)
- Hilt (already in use)
- Room (already in use)
- WorkManager (already in use)

## Status History

| Date | Status | Notes |
|------|--------|-------|
| 2026-06-09 | Planned | Initial definition |
