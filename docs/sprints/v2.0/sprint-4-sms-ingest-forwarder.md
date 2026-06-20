# Sprint 4 — SMS Ingest & Forwarder

**Sprint window:** 2026-06-17 → 2026-06-23
**Status:** 🔲 Not started
**Owner:** jokos
**Goal:** Devices can send captured SMS to the backend. The backend matches keywords, and if there's a match, forwards the SMS to the tenant's configured `forwardUrl` via HTTP POST with exponential backoff retry. The web UI shows forwarding logs with status tracking.

---

## Scope (in)

| # | Deliverable | Layer |
|---|---|---|
| 1 | `POST /v1/sms` — device sends captured SMS (API key auth) | backend |
| 2 | Keyword matching engine: match incoming SMS body against tenant's enabled keywords | backend |
| 3 | If match: create `SmsLog` row (status=PENDING), enqueue BullMQ forwarding job | backend |
| 4 | If no match: silently discard (no log row) | backend |
| 5 | SMS deduplication: `(deviceId, smsId)` unique constraint, upsert on conflict | backend |
| 6 | BullMQ worker: HTTP POST to tenant's `forwardUrl` with SMS payload | backend |
| 7 | Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 attempts) | backend |
| 8 | Forwarding payload: `{ timestamp, sender, message, matchedKeyword, deviceId }` | backend |
| 9 | Forwarding headers: `Authorization: Bearer <deviceApiKey>`, `X-Device-ID`, `Content-Type: application/json` | backend |
| 10 | `PATCH /v1/tenants/:id` — add `forwardUrl` field (already in schema, expose in API) | backend |
| 11 | Web `/sms-logs` page: table with sender, message preview, matched keyword, status, timestamp | web |
| 12 | Status filter: ALL, PENDING, FORWARDED, FAILED | web |
| 13 | Detail view: full message, retry count, error message, forwarded timestamp | web |
| 14 | E2e tests: ingest + match + forward, no-match discard, dedup, retry on 5xx, no retry on 4xx | backend |
| 15 | Node test client update: add SMS ingest flow to `claim-flow.ts` | backend |

## Scope (out — deferred to Sprint 5+)

- Per-device keyword scoping (v3)
- Batch SMS ingest (v3)
- WebSocket real-time delivery (v3+)
- Multiple forward URLs per tenant (v3+)
- Forwarding rate limits per tenant (v4)
- SMS retention pruning job (Sprint 5)

---

## Definition of Done

- [ ] `pnpm --filter @sms-monitor/backend prisma:migrate` — migration current
- [ ] `pnpm --filter @sms-monitor/backend start:dev` — boots on :3000
- [ ] `pnpm --filter @sms-monitor/web dev` — boots on :3001
- [ ] `pnpm -r typecheck` — 0 errors
- [ ] `pnpm --filter @sms-monitor/backend test:e2e` — all Sprint 1–4 tests pass
- [ ] Manual smoke: device sends SMS → keyword match → forward to webhook → log shows FORWARDED
- [ ] Manual smoke: device sends SMS → no keyword match → no log entry
- [ ] Manual smoke: device sends duplicate SMS → deduped (one log row)
- [ ] `CHANGELOG.md` has `[0.5.0]` entry
- [ ] `docs/features/sms-monitoring.md` and `docs/features/backend-forwarding.md` updated to ✅

---

## E2E Flow: SMS Ingest → Keyword Match → Forward

```
[Android Device]                       [Backend (NestJS)]                [BullMQ/Redis]
    │                                          │                            │
    │ POST /v1/sms                             │                            │
    │  Authorization: Bearer <apiKey>          │                            │
    │  { sender, message, smsId, timestamp }   │                            │
    ├─────────────────────────────────────────▶│                            │
    │                                          │ ApiKeyAuthGuard verifies   │
    │                                          │ resolve device → tenant    │
    │                                          │                            │
    │                                          │ Keyword Matching Engine    │
    │                                          │   iterate tenant's         │
    │                                          │   enabled keywords         │
    │                                          │                            │
    │                                          │ ├── match found ──▶        │
    │                                          │   INSERT sms_logs          │
    │                                          │     (status=PENDING)       │
    │                                          │                            │
    │                                          │   ENQUEUE forward-job      │
    │                                          │     ─────────────────────▶│
    │                                          │                            │
    │ 201 { smsId, matched: true }             │                            │
    │◀─────────────────────────────────────────┤                            │
    │                                          │                            │
    │                                          │   [Worker picks up job]   │
    │                                          │                            │
    │                                          │   HTTP POST to             │
    │                                          │   tenant.forwardUrl        │
    │                                          │   ────────────────────────▶│
    │                                          │     [Tenant's backend]     │
    │                                          │   ◀────────────────────────┤
    │                                          │                            │
    │                                          │   2xx → UPDATE sms_logs    │
    │                                          │     status=FORWARDED       │
    │                                          │                            │
    │                                          │   5xx → UPDATE retryCount  │
    │                                          │     re-enqueue with delay  │
```

---

## Forwarding Payload Format

```json
POST <tenant.forwardUrl>
Content-Type: application/json
Authorization: Bearer <deviceApiKey>
X-Device-ID: <deviceId>

{
  "timestamp": "2026-06-17T10:30:00.000Z",
  "sender": "+1234567890",
  "message": "Your verification code is 123456",
  "matchedKeyword": "verification",
  "deviceId": "a1b2c3d4-e5f6-7890",
  "smsId": "sha256-hash-from-device"
}
```

---

## Retry Policy

| Attempt | Delay | Cumulative | Action |
|---------|-------|------------|--------|
| 1 | immediate | 0s | HTTP POST |
| 2 | 1s | 1s | HTTP POST |
| 3 | 2s | 3s | HTTP POST |
| 4 | 4s | 7s | HTTP POST |
| 5 | 8s | 15s | HTTP POST |
| Fail | — | — | status=FAILED, store errorMessage |

- **4xx responses**: no retry (client error, permanent)
- **5xx responses**: retry with backoff
- **Timeout (30s)**: retry with backoff
- **Network error**: retry with backoff

---

## Keyword Matching Engine

```typescript
function matchKeywords(smsBody: string, keywords: Keyword[]): string | null {
  for (const kw of keywords) {
    if (!kw.enabled) continue;
    const matched = matchOne(smsBody, kw.word, kw.matchMode);
    if (matched) return kw.word;
  }
  return null;
}

function matchOne(body: string, word: string, mode: MatchMode): boolean {
  switch (mode) {
    case 'EXACT':    return body === word;
    case 'CONTAINS': return body.toLowerCase().includes(word.toLowerCase());
    case 'REGEX':    return new RegExp(word).test(body);
    case 'AT_START': return body.startsWith(word);
    case 'AT_END':   return body.endsWith(word);
  }
}
```

- First match wins (keyword iteration order: `createdAt ASC`)
- If no keyword matches, the SMS is silently discarded (no log row)

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP4-T1 | SmsIngestModule | `POST /v1/sms` — API key auth, validate payload, dedup check | 3h | P0 | ✅ |
| F-SP4-T2 | Keyword matching engine | `matchKeywords()` function, iterate tenant's enabled keywords, first-match wins | 2h | P0 | ✅ |
| F-SP4-T3 | SmsForwarderModule | BullMQ queue + worker, HTTP POST to `forwardUrl`, retry logic | 4h | P0 | ✅ |
| F-SP4-T4 | Forward URL config | `PATCH /v1/tenants/:id` — expose `forwardUrl` field, validate URL format | 1h | P0 | ✅ |
| F-SP4-T5 | Web /sms-logs page | Table: sender, message preview, matched keyword, status badge, timestamp | 3h | P0 | ✅ |
| F-SP4-T6 | Status filter | Dropdown/tabs: ALL, PENDING, FORWARDED, FAILED | 1h | P0 | ✅ |
| F-SP4-T7 | Detail view | Expandable row or modal: full message, retry count, error, forwardedAt | 2h | P0 | ✅ |
| F-SP4-T8 | E2e tests | Ingest+match+forward, no-match discard, dedup, retry 5xx, no retry 4xx, cross-tenant | 4h | P0 | ✅ |
| F-SP4-T9 | Node test client | Update `claim-flow.ts` to include SMS ingest flow | 2h | P1 | ✅ |
| F-SP4-T10 | Docs | Update sms-monitoring.md, backend-forwarding.md, sprint doc, CHANGELOG [0.5.0] | 1.5h | P1 | ✅ |
| F-SP4-T11 | Manual smoke | Full flow: claim device → send SMS → match keyword → forward → check log | 1h | P0 | ⏸ |

**Sprint 4 total: ~24.5h** of focused work.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| BullMQ not running (Redis down) | Medium | Health check on `/health` already checks Redis; fail fast on startup |
| Tenant's `forwardUrl` is unreachable | High | Retry 5 times then mark FAILED; clear error message in log |
| Device sends SMS very fast (burst) | Low | BullMQ handles backpressure; dedup prevents duplicate logs |
| Keyword matching is slow with 100 keywords | Low | Simple string ops, <1ms even at 100 keywords |
| Redis memory growth from queued jobs | Low | BullMQ has built-in cleanup; failed jobs auto-expire |

---

## Status

_Starting after Sprint 3 completion._
