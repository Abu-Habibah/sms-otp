# Sprint Backlog

**Project:** SMS Monitor
**Current Sprint:** Phase 4.5 - Bugfixes & UX Tweaks (2026-06-08)
**Last Updated:** 2026-06-08

---

## Phase 1: Core Functionality ✅ COMPLETE

**Duration:** 1 week
**Goal:** SMS monitoring and basic forwarding working end-to-end

### Sprint Backlog

| ID | Task | Description | Est. Time | Priority | Status |
|----|------|-------------|-----------|----------|--------|
| F-SP1-T1 | Project Setup | Create Kotlin Android project, add dependencies | 2h | P0 | ✅ Done |
| F-SP1-T2 | SMS Receiver | Implement Android BroadcastReceiver | 4h | P0 | ✅ Done |
| F-SP1-T3 | Database | Setup Room with Keyword/Log/Pending tables | 3h | P0 | ✅ Done |
| F-SP1-T4 | Keyword Service | CRUD operations for keywords | 3h | P1 | ✅ Done |
| F-SP1-T5 | Forwarding Service | Basic HTTP POST without retry | 4h | P0 | ✅ Done |
| F-SP1-T6 | Keyword Matching | MatchMode logic (EXACT/CONTAINS/REGEX) | 2h | P1 | ✅ Done |

### Definition of Done — ALL MET ✅

- [x] SMS received triggers keyword check
- [x] Matching SMS logged to forwarding_logs
- [x] ForwardingService posts to test endpoint successfully
- [x] Unit tests for keyword matching pass (18 test cases)
- [x] App handles permission denial gracefully
- [x] No crashes on app restart

---

## Phase 2: Background Processing ✅ COMPLETE

**Duration:** 1 week
**Goal:** Reliable background forwarding with retry logic

### Sprint Backlog

| ID | Task | Description | Est. Time | Priority | Status |
|----|------|-------------|-----------|----------|--------|
| F-SP2-T1 | WorkManager | Background job setup with constraints | 4h | P0 | ✅ Done |
| F-SP2-T2 | Retry Logic | Exponential backoff (max 5 attempts) | 3h | P0 | ✅ Done |
| F-SP2-T3 | Forwarding Logs | Log success/failure history | 3h | P1 | ✅ Done |
| F-SP2-T4 | Settings UI | Backend URL and API key input | 4h | P1 | ✅ Done |
| F-SP2-T5 | Network Change | Retry on connectivity restore | 2h | P1 | ✅ Done |

### Definition of Done — ALL MET ✅

- [x] App killed by system continues forwarding
- [x] Network loss queues messages for retry
- [x] Retry count tracked and limited to 5
- [x] Logs display status (PENDING/SUCCESS/FAILED)
- [x] Settings persist across app restarts

---

## Phase 3: UI and Polish ✅ COMPLETE

**Duration:** 1 week
**Goal:** Complete UI and handle edge cases

### Sprint Backlog

| ID | Task | Description | Est. Time | Priority | Status |
|----|------|-------------|-----------|----------|--------|
| F-SP3-T1 | Keywords UI | List with swipe-delete, add dialog | 4h | P1 | ✅ Done |
| F-SP3-T2 | Logs UI | Status filter, detail view | 3h | P1 | ✅ Done |
| F-SP3-T3 | Main Dashboard | Status overview, toggle monitoring | 3h | P1 | ✅ Done |
| F-SP3-T4 | Error Handling | Permission denial UI, network errors | 4h | P1 | ✅ Done |
| F-SP3-T5 | ProGuard | Obfuscation and release build | 2h | P2 | ✅ Done |

### Definition of Done — ALL MET ✅

- [x] All UI screens implemented
- [x] Error states handled gracefully
- [x] Release build with ProGuard obfuscation works

---

## Phase 4: Polish & Test API ✅ COMPLETE

**Duration:** 2026-06-07 → 2026-06-08
**Goal:** UX improvements, testing tools, build-toolchain modernization, and release preparation

### Sprint Backlog

| ID | Task | Description | Est. Time | Priority | Status |
|----|------|-------------|-----------|----------|--------|
| F-SP4-T1 | Version Info Display | Show version number on landing page | 1h | P1 | ✅ Done |
| F-SP4-T2 | Auto-Increment Build | Auto-increment build counter per build | 1h | P1 | ✅ Done |
| F-SP4-T3 | "At Start"/"At End" Match Modes | New keyword location matchers | 1h | P1 | ✅ Done |
| F-SP4-T4 | Default Local Test URL | Pre-fill settings with local test server | 1h | P1 | ✅ Done |
| F-SP4-T5 | Auto-Generated API Key | UUID on first launch | 1h | P1 | ✅ Done |
| F-SP4-T6 | Show/Hide API Key | Toggle visibility of API key in settings | 1h | P2 | ✅ Done |
| F-SP4-T7 | Local Test Backend | Express server for testing | 2h | P1 | ✅ Done |
| F-SP4-T8 | Test API Page | In-app tool to send test SMS to backend | 3h | P1 | ✅ Done |
| F-SP4-T9 | Save Button Fix | Toast feedback + better state handling | 1h | P0 | ✅ Done |
| F-SP4-T10 | Cleartext HTTP Config | Allow HTTP for local testing | 0.5h | P1 | ✅ Done |
| F-SP4-T11 | Gradle Toolchain Upgrade | Bump Gradle 8.13 → 9.5.0; remove deprecated `gradle.properties` flags | 0.5h | P1 | ✅ Done |

### Definition of Done — ALL MET ✅

- [x] All Phase 4 tasks delivered
- [x] Build succeeds on current Gradle 9.5.0 + AGP 9.2.1 + Kotlin 2.3.9
- [x] `gradle.properties` free of AGP-9-deprecated flags
- [x] Toolchain version matrix captured in [`docs/architecture/build-toolchain.md`](../architecture/build-toolchain.md)

---

## Phase 4.5: Bugfixes & UX Tweaks ✅ COMPLETE

**Duration:** 2026-06-08
**Goal:** Fix issues found during real-device testing after Phase 4

### Sprint Backlog

| ID | Task | Description | Est. Time | Priority | Status |
|----|------|-------------|-----------|----------|--------|
| F-SP45-T1 | Fix duplicate log rows | Remove the direct HTTP send in `ForwardingService`; add `upsertLog()` in `SmsForwardWorker` so each SMS gets exactly one log row (PENDING → SUCCESS) | 0.5h | P0 | ✅ Done |
| F-SP45-T2 | Edit keyword | Add tap-to-edit on the keyword list row; reuse the add dialog pre-filled | 1h | P1 | ✅ Done |
| F-SP45-T3 | Visible Edit/Delete buttons | Replace long-press delete with explicit Edit + Delete icon buttons on each keyword row | 0.5h | P1 | ✅ Done |
| F-SP45-T4 | Receiver immediate-send | Add in-process HTTP send in `SmsBroadcastReceiver` (after keyword match) so the worker isn't the only delivery path. Extract `SmsHttpSender` so both paths share the request format. Update worker to use KEEP policy + `NetworkType.CONNECTED` constraint. | 1.5h | P0 | ✅ Done |

### Notes
- These were discovered while the app was running on the real device, after the Phase 4 toolchain upgrade. The root cause of the duplicate-log bug was a leftover direct-send path in `ForwardingService` that ran in parallel with WorkManager; the worker had no idea the row already existed.
- **F-SP45-T4 (receiver immediate-send) was added because real-device testing revealed WorkManager on ColorOS / Oppo is throttled to the point of being unreliable for SMS forwarding** — `OplusHansManager` freezes the process when the screen is off, the app was assigned to the `RARE` standby bucket (10), and jobs run for 64ms then are stopped. The receiver now does the HTTP send in-process as the primary path; WorkManager is the retry fallback. This is the standard pattern for SMS-forwarder apps on aggressive OEMs.

---

## Phase 5: Release Prep (NEXT) 🎯

**Duration:** TBD
**Goal:** Ship a signed, installable release build

### Sprint Backlog

| ID | Task | Description | Est. Time | Priority | Status |
|----|------|-------------|-----------|----------|--------|
| F-SP5-T1 | Signing Config | Generate release keystore + signing config | 1h | P0 | 🔲 Todo |
| F-SP5-T2 | Release APK | Produce signed release APK and verify install | 1h | P0 | 🔲 Todo |
| F-SP5-T3 | App Icon | Replace placeholder icon with branded icon | 1h | P1 | 🔲 Todo |
| F-SP5-T4 | Store Listing Draft | Draft Play Store / sideload description | 1h | P2 | 🔲 Todo |
| F-SP5-T5 | README Refresh | Top-level README with install + screenshots | 1h | P1 | 🔲 Todo |

---

## Future Backlog

### Security & Reliability

| ID | Task | Priority | Effort | Notes |
|----|------|----------|--------|-------|
| F-FUT-T1 | Certificate Pinning | P2 | 0.5 day | Prevents MITM attacks on HTTP forwarding |
| F-FUT-T6 | EncryptedSharedPreferences | P1 | 0.5 day | Encrypt API keys and sensitive data at rest |
| F-FUT-T7 | Foreground Service for Critical Forwarding | P1 | 1 day | Persistent notification ensures forwarding survives OEM battery optimization |
| F-FUT-T8 | Battery Optimization Exemption Prompt | P1 | 0.5 day | Guide users to whitelist app from Doze/standby buckets |

### Android v2.0 Multi-Tenant

| ID | Task | Priority | Effort | Notes |
|----|------|----------|--------|-------|
| F-FUT-T9 | QR Code Scanner for Device Claim | P0 | 1 day | Scan claim codes from web admin (Sprint 4 dependency) |
| F-FUT-T10 | Manual Code Entry (Fallback) | P0 | 0.5 day | 8-char alphanumeric input for broken cameras |
| F-FUT-T11 | HMAC Device Token Authentication | P0 | 1 day | `Authorization: Bearer <apiKey>` + `X-Device-Signature` + `X-Device-Timestamp` |
| F-FUT-T12 | Tenant Selection UI | P1 | 1 day | Switch between tenants if device is multi-tenant |
| F-FUT-T13 | Backend Keyword Sync | P1 | 1 day | Pull keywords from backend instead of local-only |

### Architecture & Quality

| ID | Task | Priority | Effort | Notes |
|----|------|----------|--------|-------|
| F-FUT-T14 | Jetpack Compose Migration | P2 | 3-5 days | Modern declarative UI, Material 3, less boilerplate |
| F-FUT-T15 | Modular Architecture Split | P3 | 2-3 days | Split into `:app`, `:core`, `:domain`, `:data` modules |
| F-FUT-T16 | Android Unit Test Suite | P2 | 2-3 days | Cover KeywordService, SmsHttpSender, ForwardingRepository |
| F-FUT-T17 | Android Integration Tests | P2 | 1-2 days | Room + WorkManager integration tests |
| F-FUT-T18 | Android UI Tests | P3 | 1-2 days | Espresso/Compose Testing for critical flows |

### Features

| ID | Task | Priority | Effort | Notes |
|----|------|----------|--------|-------|
| F-FUT-T2 | Multiple Endpoints | P3 | 2 days | Forward to multiple APIs |
| F-FUT-T3 | Cloud Sync | P3 | 2 days | Sync keywords across devices |
| F-FUT-T4 | SMS History View | P3 | 1 day | View all received SMS, not just matched |
| F-FUT-T5 | Custom Notifications | P2 | 1 day | Notify on forwarding success/failure |
| F-FUT-T19 | Enhanced Multi-Part SMS Reassembly | P2 | 1 day | 10-part reassembly within 5s window |
| F-FUT-T20 | Dual SIM Support | P2 | 1 day | Detect SIM slot, include in payload; both SIMs → same tenant |

---

## Related Documentation

- [SMS Monitoring](../features/sms-monitoring.md) — Feature details
- [Keyword Configuration](../features/keyword-configuration.md) — Feature details
- [Backend Forwarding](../features/backend-forwarding.md) — Feature details
- [Forwarding Logs](../features/forwarding-logs.md) — Feature details
- [Settings Configuration](../features/settings-configuration.md) — Feature details
- [System Overview](../architecture/system-overview.md) — Architecture
- [Build Toolchain](../architecture/build-toolchain.md) — Gradle / AGP / Kotlin version matrix
- [Test Backend](../../test-backend/README.md) — Local development server

## Status Legend

- **Todo:** Not started
- **In Progress:** Currently working
- **Done:** Completed
- **Blocked:** Waiting on dependency
- ✅ Done
- 🚧 In progress
- 🔲 Todo
- 🎯 Next sprint
