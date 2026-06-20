# Sprint 6 — Backend Keyword Sync

**Sprint window:** 2026-06-11 → 2026-06-11
**Status:** ✅ Complete
**Owner:** jokos
**Goal:** Android app syncs keywords from backend instead of local-only. Backend is source of truth.

---

## What exists already

| File | Purpose | Status |
|------|---------|--------|
| `KeywordSyncService.kt` | Pulls keywords from `GET /v1/keywords` | ✅ Implemented |
| `KeywordDao.kt` | Room database operations | ✅ Has `deleteAll()` |
| `SettingsRepository.kt` | Stores `lastKeywordSyncTime` | ✅ Ready |
| `KeywordService.kt` | Local keyword matching | ✅ Uses Room data |

---

## Scope (in)

| # | Deliverable | Layer |
|---|-------------|-------|
| 1 | Auto-sync keywords on app launch after claim | Android |
| 2 | Sync keywords after heartbeat succeeds | Android |
| 3 | Add HMAC signature to keyword sync request | Android |
| 4 | Show sync status in dashboard | Android |

## Scope (out)

- Real-time keyword push from backend (v3+)
- Per-device keyword scoping (v3+)
- Keyword categories/tags (v3+)

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP6-T1 | Auto-sync on launch | Call `keywordSyncService.syncKeywords()` in MainActivity after claim check | 1h | P0 | ✅ |
| F-SP6-T2 | HMAC signature | Add `X-Device-Signature` + `X-Device-Timestamp` to keyword sync request | 1h | P0 | ✅ |
| F-SP6-T3 | Sync after heartbeat | Trigger keyword sync after successful heartbeat in HeartbeatService | 1h | P1 | ✅ |
| F-SP6-T4 | Dashboard sync status | Show "Last synced: X minutes ago" in dashboard | 1h | P1 | ✅ |

**Sprint 6 total: ~4h** of focused work.

---

## Status

_Sprint 6 completed 2026-06-11._
