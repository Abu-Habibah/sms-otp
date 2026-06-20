# Sprint 7 — SMS Ingest (v2.0 Endpoint)

**Sprint window:** 2026-06-11 → 2026-06-11
**Status:** ✅ Complete
**Owner:** jokos
**Goal:** Android app sends captured SMS to backend using v2.0 API with HMAC authentication. Backend matches keywords and forwards to tenant URL.

---

## What exists already

| File | Purpose | Status |
|------|---------|--------|
| `SmsHttpSender.kt` | HTTP POST to `/v1/sms` with HMAC | ✅ Implemented |
| `SmsBroadcastReceiver.kt` | Captures SMS, matches keywords, sends | ✅ Working |
| `SmsForwardWorker.kt` | WorkManager retry fallback | ✅ Working |
| `HeartbeatService.kt` | Periodic heartbeat to backend | ✅ Implemented |

---

## Scope (in)

| # | Deliverable | Layer |
|---|-------------|-------|
| 1 | Ensure v2.0 endpoint (`/v1/sms`) is used when device is claimed | Android |
| 2 | Add HMAC signature to SMS ingest request | Android |
| 3 | Handle backend keyword matching response | Android |
| 4 | Log forwarding status from backend response | Android |

## Scope (out)

- Batch SMS ingest (v3+)
- WebSocket real-time delivery (v3+)
- Multiple forward URLs per tenant (v3+)

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP7-T1 | v2.0 endpoint verification | Ensure `SmsHttpSender` uses `/v1/sms` when claimed, `/sms/forward` when not | 1h | P0 | ✅ |
| F-SP7-T2 | HMAC signature for SMS | Verify `X-Device-Signature` + `X-Device-Timestamp` headers sent | 1h | P0 | ✅ |
| F-SP7-T3 | Backend response handling | Parse backend response for keyword match status | 1h | P0 | ✅ |
| F-SP7-T4 | Forwarding log sync | Update local log with backend status (FORWARDED/FAILED) | 1h | P1 | ✅ |

**Sprint 7 total: ~4h** of focused work.

---

## Status

_Sprint 7 completed 2026-06-11._
