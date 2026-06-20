# Feature: Keyword Sync After Heartbeat

**Feature ID:** F-KW-SYNC-HB
**Status:** ✅ Implemented (Sprint 8)
**Last Updated:** 2026-06-11

---

## Overview

### Description

Keywords are synced from the backend to the Android app **after each successful heartbeat**. This ensures the app stays up-to-date with keyword changes made in the web admin without requiring a restart.

### Problem Solved

Currently, keywords only sync once on app launch. If an admin adds/removes keywords while the app is running, the device won't pick up changes until the next app restart.

### User Story

> As a tenant admin, I want keyword changes to take effect on devices immediately (or within 60 seconds), so I don't need to ask users to restart their apps.

---

## Scope

### In Scope

- Sync keywords after successful heartbeat response
- Throttle sync to avoid excessive API calls
- Log sync results for debugging

### Out of Scope

- Real-time push from backend (v4+)
- Per-device keyword scoping (v4+)
- WebSocket updates

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | Keywords sync after successful heartbeat (HTTP 200) |
| AC-2 | Sync is throttled to max once per 5 minutes |
| AC-3 | Failed heartbeat does NOT trigger keyword sync |
| AC-4 | Failed keyword sync does NOT affect heartbeat status |
| AC-5 | Sync uses HMAC authentication (existing KeywordSyncService) |
| AC-6 | Sync results logged (success count or error) |

---

## Current State

### What Exists

| File | Purpose | Status |
|------|---------|--------|
| `KeywordSyncService.kt` | Pulls keywords from `GET /v1/keywords` | ✅ Implemented |
| `HeartbeatService.kt` | Sends heartbeat every 60s | ✅ Implemented |
| `MainActivity.kt` | Syncs keywords on launch | ✅ Implemented |

### What's Missing

- HeartbeatService does NOT call KeywordSyncService after successful heartbeat

---

## Implementation Plan

### Option A: Inject KeywordSyncService into HeartbeatService

```kotlin
// HeartbeatService.kt
@Inject
lateinit var keywordSyncService: KeywordSyncService

private suspend fun sendHeartbeat() {
    // ... existing heartbeat logic ...
    
    if (response.isSuccessful) {
        Log.d(TAG, "Heartbeat successful")
        
        // Throttle: only sync if last sync > 5 min ago
        val lastSync = settingsRepository.lastKeywordSyncTime
        val now = System.currentTimeMillis()
        if (now - lastSync > 5 * 60 * 1000) {
            keywordSyncService.syncKeywords()
        }
    }
}
```

### Option B: Use Shared CoroutineScope

- Both services share a coroutine scope
- HeartbeatService emits a "heartbeat succeeded" event
- KeywordSyncService listens and syncs

**Recommendation:** Option A (simpler, fewer moving parts)

---

## Throttling Logic

```kotlin
private val SYNC_THROTTLE_MS = 5 * 60 * 1000L  // 5 minutes

private suspend fun syncKeywordsIfNeeded() {
    val lastSync = settingsRepository.lastKeywordSyncTime
    val now = System.currentTimeMillis()
    
    if (now - lastSync < SYNC_THROTTLE_MS) {
        Log.d(TAG, "Keyword sync throttled (last sync ${(now - lastSync) / 1000}s ago)")
        return
    }
    
    when (val result = keywordSyncService.syncKeywords()) {
        is SyncResult.Success -> {
            Log.d(TAG, "Synced ${result.count} keywords from heartbeat")
            settingsRepository.lastKeywordSyncTime = now
        }
        is SyncResult.Error -> {
            Log.w(TAG, "Keyword sync failed: ${result.message}")
        }
    }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/src/main/java/com/smsmonitor/app/service/HeartbeatService.kt` | Inject KeywordSyncService, call after successful heartbeat |
| `app/src/main/java/com/smsmonitor/data/repository/SettingsRepository.kt` | Expose `lastKeywordSyncTime` for throttling |

---

## Timing Diagram

```
Heartbeat (every 60s)
    ↓
Success?
    ├── NO → Skip sync, retry next heartbeat
    │
    └── YES → Check throttle (last sync > 5 min?)
              ├── NO → Skip sync
              │
              └── YES → Sync keywords
                        ├── Success → Update lastSyncTime
                        └── Error → Log warning, continue
```

---

## Cross-references

- Sprint doc: `docs/sprints/v2.0/sprint-6-keyword-sync.md` (F-SP6-T3)
- Related feature: `docs/features/keyword-configuration.md`
- Service: `KeywordSyncService.kt`
- Service: `HeartbeatService.kt`
