# Architecture: System Overview

**Last Updated:** 2026-06-08

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMS Monitor App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌────────────────┐     ┌───────────────┐  │
│  │    SMS       │────▶│   Keyword      │────▶│   Forward     │  │
│  │  Receiver    │     │   Matcher      │     │   Service     │  │
│  └──────────────┘     └────────────────┘     └───────┬───────┘  │
│                                                      │          │
│                                                      ▼          │
│  ┌──────────────┐     ┌────────────────┐     ┌───────────────┐  │
│  │    Local     │◀────│   Repository   │     │  Background   │  │
│  │   Room DB    │     │    Layer       │     │     Jobs      │  │
│  └──────────────┘     └────────────────┘     └───────┬───────┘  │
│                                                      │          │
│                                                      ▼          │
│                                              ┌───────────────┐  │
│                                              │  HTTP Client │  │
│                                              │   (Retrofit) │  │
│                                              └───────┬───────┘  │
└──────────────────────────────────────────────────────┼──────────┘
                                                        │
                                                        ▼
                                               ┌───────────────┐
                                               │    Backend    │
                                               │   Endpoint    │
                                               └───────────────┘
```

---

## Component Responsibilities

### SMS Receiver
- Listens for `android.provider.Telephony.SMS_RECEIVED` broadcast
- Extracts sender, body, timestamp from PDU
- Generates unique SMS_ID
- Passes to KeywordMatcher immediately (no blocking)

### Keyword Matcher
- Loads enabled keywords from Room
- Applies match mode (EXACT/CONTAINS/REGEX)
- Returns first match found
- Passes to ForwardService if match

### Forward Service
- Queues forward request to pending_forwards
- Enqueues background job
- Tracks retry count and status

### Background Job (WorkManager)
- Executes when constraints met (network, battery)
- Performs HTTP POST via Retrofit
- Updates status on success/failure
- Schedules retry on exponential backoff

### Repository Layer
- Abstracts Room operations
- KeywordRepository: CRUD for keywords
- ForwardingLogRepository: Log history
- PendingForwardRepository: Retry queue

---

## Technology Choices

| Layer | Component | Reason |
|-------|-----------|--------|
| SMS Access | Platform-specific BroadcastReceiver | Required for SMS interception |
| Background | WorkManager | Reliable job scheduling, battery-aware |
| HTTP | Retrofit + OkHttp | Type-safe, compile-time verification |
| Database | Room | Compile-time verified SQLite |
| DI | Hilt | Standard Android DI |
| MVVM | Jetpack ViewModel + StateFlow | Lifecycle-aware, reactive |
| Build | Gradle 9.5.0 + AGP 9.2.1 + Kotlin 2.3.9 | See [Build Toolchain](./build-toolchain.md) for the full matrix |

---

## Security Architecture

```
┌─────────────────────────────────────┐
│         Security Boundaries          │
├─────────────────────────────────────┤
│                                      │
│  [App Boundary]                      │
│     │                                │
│     ├── API Keys ──▶ EncryptedSharedPreferences │
│     │              (Encrypted)       │
│     │                                │
│     ├── SMS Content ──▶ Local Only   │
│     │              (Not logged)      │
│     │                                │
│     └── Network ──▶ HTTPS + Pinning  │
│                                      │
└─────────────────────────────────────┘
```

### Security Status

| Feature | Status | Notes |
|---------|--------|-------|
| API Keys in plain SharedPrefs | ⚠️ Current | Migrate to EncryptedSharedPreferences |
| Certificate Pinning | 🔲 Planned | See [Android Enhancements](../features/android-enhancements.md) |
| HTTPS enforcement | ✅ Done | Network security config allows cleartext for local dev only |

---

## Performance & Reliability

### OEM Compatibility Matrix

| OEM | Issue | Mitigation |
|-----|-------|------------|
| ColorOS (Oppo/Realme) | `OplusHansManager` freezes background processes | Immediate in-process send + Foreground Service (planned) |
| EMUI (Huawei) | Aggressive standby bucket assignment | Battery exemption prompt (planned) |
| MIUI (Xiaomi) | Background process limits | Foreground Service (planned) |
| Stock Android | Doze mode | Battery exemption prompt (planned) |

### Forwarding Strategy

```
[SMS Received + Keyword Match]
        │
        ▼
[Immediate In-Process Send] ──── Primary path
        │
        ├── Success ──▶ [Log SUCCESS, delete pending]
        │
        └── Failure ──▶ [WorkManager Retry Fallback]
                            │
                            ▼
                        [Foreground Service] ──── Planned
                            │
                            ▼
                        [Exponential Backoff: 10s, 20s, 40s...]
                            │
                            ▼
                        [Max 5 retries → Log FAILED]
```

### Future Enhancements

| Enhancement | Priority | Effort | Status |
|-------------|----------|--------|--------|
| Foreground Service | P1 | 1 day | Planned |
| Battery Exemption Prompt | P1 | 0.5 day | Planned |
| Certificate Pinning | P2 | 0.5 day | Planned |
| EncryptedSharedPreferences | P1 | 0.5 day | Planned |
| Dual SIM Support | P2 | 1 day | Planned (both SIMs → same tenant) |

See [Android Enhancements](../features/android-enhancements.md) for implementation details.

---

## Data Flow Summary

1. **SMS arrives** → BroadcastReceiver extracts data
2. **Keyword check** → Match against enabled keywords
3. **Queue** → Save to pending_forwards with PENDING status
4. **Background job** → WorkManager picks up
5. **HTTP POST** → Retrofit sends to backend
6. **Result** → Update status to SUCCESS or schedule retry

---

## File Structure

```
SmsMonitor/
├── App.kt                              # App entry, DI setup
├── MainActivity.kt
├── Platforms/Android/
│   └── SmsBroadcastReceiver.kt         # SMS interception
├── data/
│   ├── local/
│   │   ├── AppDatabase.kt              # Room database
│   │   ├── dao/
│   │   │   ├── KeywordDao.kt
│   │   │   ├── ForwardingLogDao.kt
│   │   │   └── PendingForwardDao.kt
│   │   └── entity/
│   │       ├── KeywordEntity.kt
│   │       ├── ForwardingLogEntity.kt
│   │       └── PendingForwardEntity.kt
│   └── repository/
│       ├── KeywordRepository.kt
│       └── ForwardingRepository.kt
├── domain/
│   ├── model/
│   │   ├── SmsMessage.kt
│   │   ├── Keyword.kt
│   │   └── ForwardingLog.kt
│   └── service/
│       ├── KeywordService.kt
│       └── ForwardingService.kt
├── ui/
│   ├── theme/
│   ├── screens/
│   │   ├── main/
│   │   ├── keywords/
│   │   ├── logs/
│   │   └── settings/
│   └── components/
├── jobs/
│   └── SmsForwardWorker.kt            # WorkManager implementation
└── di/
    └── AppModule.kt                    # Hilt modules
```

---

## Related Documentation

- [SMS Monitoring](../features/sms-monitoring.md) — SMS interception details
- [Keyword Configuration](../features/keyword-configuration.md) — Keyword management
- [Backend Forwarding](../features/backend-forwarding.md) — HTTP forwarding
- [Forwarding Logs](../features/forwarding-logs.md) — Log history
- [Settings Configuration](../features/settings-configuration.md) — App settings
- [Build Toolchain](./build-toolchain.md) — Gradle / AGP / Kotlin version matrix
- [Sprint Backlog](../sprints/backlog.md) — Implementation tasks

---

## Status

**Last Updated:** 2026-06-08
