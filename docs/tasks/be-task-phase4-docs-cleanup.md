# Task: Phase 4 — Documentation Cleanup

**System:** shared, web, android
**Priority:** Medium
**Estimated:** ~1 hour
**Can Run In Parallel With:** Phase 1, Phase 2, Phase 3
**Depends On:** Nothing (docs-only, no code changes)

---

## Goal

Fix 9 documentation staleness issues identified in the audit — update sprint statuses, remove stub code, align claim endpoint path.

---

## Task 4.1 — Update Sprint Doc Statuses

The following sprint files have stale statuses that contradict the README and actual implementations:

| Sprint | Current Status | Actual Status | File |
|--------|---------------|---------------|------|
| Sprint 0 | "In Progress" | ✅ Complete | `docs/sprints/v2.0/sprint-0-foundation.md` |
| Sprint 2 | "In progress" | ✅ Complete | `docs/sprints/v2.0/sprint-2-devices-claim-codes.md` |
| Sprint 3 | "🔲 Not started" | ✅ Complete | `docs/sprints/v2.0/sprint-3-keywords.md` |
| Sprint 4 | "🔲 Not started" | ✅ Complete | `docs/sprints/v2.0/sprint-4-sms-ingest-forwarder.md` |
| Sprint 9 | "🟡 In progress" | ✅ Complete | `docs/sprints/v2.0/sprint-9-workspaces.md` |

**For each file:**
1. Update the status line at the top to `✅ Complete` with date `2026-06-18`
2. Check all `- [ ]` DoD items → change to `- [x]` if actually done
3. Mark all `🔲` task items → `✅` if implemented
4. Add a note: "Status updated by Sisyphus audit on 2026-06-21 — all tasks verified complete in codebase."

---

## Task 4.2 — Check Off Sprint 8 AC Checkboxes

**File:** `docs/sprints/v2.0/sprint-8-api-completion-cleanup.md`

14 acceptance criteria for Task 3 (publicApiUrl) and Task 4 (keyword sync) are unchecked but implemented:

| Lines | Task | AC Count |
|-------|------|----------|
| 172-179 | Task 3 (publicApiUrl) | AC-1 through AC-8 |
| 215-220 | Task 4 (keyword sync) | AC-1 through AC-6 |

Change all `- [ ]` to `- [x]`.

---

## Task 4.3 — Update Feature Doc Statuses

### 4.3a — workspace-scoped-claim.md

**File:** `docs/features/workspace-scoped-claim.md`

Status says "🔲 Not started" but backend changes are implemented:
- Update status to: "✅ Backend implemented, Android/Web pending"
- Note which AC items are done (claim response, ApiKeyAuthGuard, keyword filtering)

### 4.3b — auth.md stale checkboxes

**File:** `docs/features/auth.md`

Bottom of file has stale "in progress" checkboxes for Sprint 1/2. Mark completed items as done.

### 4.3c — backlog.md cleanup

**File:** `docs/sprints/backlog.md`

Features listed as "Future" that are already implemented:
- EncryptedSharedPreferences → mark as ✅ Done
- Foreground Service → mark as ✅ Done

---

## Task 4.4 — Fix Claim Endpoint Path in Docs

**File:** `docs/features/claim-codes.md` (line 72)

| Current | Correct |
|---------|---------|
| `POST \| /v1/claim` | `POST \| /v1/claim-codes/claim` |

Also update any other references to `/v1/claim` in:
- `docs/features/device-onboarding.md`
- `docs/runbooks/04-android-v2-smoke-test.md`

---

## Task 4.5 — Remove "Coming Soon" Stub

**File:** `app/src/main/java/com/smsmonitor/app/claim/TenantSelectionActivity.kt` (line 63)

Current:
```kotlin
Toast.makeText(this, "Multi-tenant switching coming in v2.1", Toast.LENGTH_SHORT).show()
```

Replace with actual navigation to claim flow:
```kotlin
// Navigate to claim flow (manual code entry)
startActivity(Intent(this, ManualCodeEntryActivity::class.java))
```

Or if keeping as stub, add a `// TODO: v3+` comment and redirect to main activity.

---

## Task 4.6 — Update Device Sort Order in Docs

**File:** `docs/features/devices.md` AC-9

After Phase 3 Task 3.2 fixes the sort order in code, verify the documentation matches:
```
| AC-9 | The list response is sorted by `lastSeenAt DESC NULLS LAST, createdAt ASC`. |
```

If the code change is applied first, this doc is already correct.

---

## Deliverables

- [ ] 5 sprint docs with updated statuses and checked-off items
- [ ] 14 AC checkboxes ticked in sprint-8
- [ ] 3 feature docs fixed (workspace-scoped-claim, auth, backlog)
- [ ] Claim endpoint path aligned in 3+ docs
- [ ] TenantSelectionActivity stub removed or redirected
- [ ] All doc links still valid (no broken references)

---

## Files Changed

| File | Change |
|------|--------|
| `docs/sprints/v2.0/sprint-0-foundation.md` | Status + checkboxes |
| `docs/sprints/v2.0/sprint-2-devices-claim-codes.md` | Status + checkboxes |
| `docs/sprints/v2.0/sprint-3-keywords.md` | Status + checkboxes |
| `docs/sprints/v2.0/sprint-4-sms-ingest-forwarder.md` | Status + checkboxes |
| `docs/sprints/v2.0/sprint-9-workspaces.md` | Status + checkboxes |
| `docs/sprints/v2.0/sprint-8-api-completion-cleanup.md` | 14 AC checkboxes |
| `docs/features/workspace-scoped-claim.md` | Status update |
| `docs/features/auth.md` | Checkboxes |
| `docs/features/claim-codes.md` | Claim endpoint path |
| `docs/features/device-onboarding.md` | Claim endpoint path |
| `docs/runbooks/04-android-v2-smoke-test.md` | Claim endpoint path |
| `docs/sprints/backlog.md` | Mark implemented features |
| `app/.../TenantSelectionActivity.kt` | Remove stub |
