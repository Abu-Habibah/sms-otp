# Feature: Keyword Configuration

**Status:** ✅ Sprint 3 — implemented
**Feature ID:** F-002
**Last Updated:** 2026-06-09

## Overview

**Description:** Allow users to manage a list of keywords for filtering incoming SMS messages.

**User Story:** As a user, I want to add/remove keywords so that only relevant SMS are forwarded to my backend.

---

## Scope

**In Scope:**
- Add new keyword with match mode selection
- Edit existing keyword
- Delete keyword with swipe gesture
- Toggle keyword enabled/disabled
- Keyword validation (min 2 chars, max 50 chars)
- Maximum 100 keywords per installation

**Out of Scope:**
- Import/export keyword lists
- Keyword suggestions or auto-complete
- Cloud sync of keywords
- Keyword categories or tags

---

## Match Modes

| Mode | Description | Example |
|------|-------------|---------|
| EXACT | Case-sensitive exact match | "OTP" matches "OTP" only |
| CONTAINS | Case-insensitive partial match | "OTP" matches "Your OTP is..." |
| REGEX | Regular expression pattern | "\d{6}" matches any 6-digit code |

---

## E2E Flow: Add Keyword

```
[User taps Add (+) button]
        │
        ▼
[Show AddKeywordDialog]
        │
        ▼
[User enters keyword + selects match mode]
        │
        ▼
[KeywordService.Validate(keyword)]
        │
        ├── Valid ──▶ [KeywordRepository.Insert(keyword)]
        │                   │
        │                   ▼
        │              [Room: keywords table]
        │                   │
        │                   ▼
        │              [Update ViewModel.Keywords]
        │
        └── Invalid ──▶ [Show validation error message]
```

---

## Data Model

```kotlin
data class Keyword(
    val id: Int = 0,
    val word: String,          // 2-50 chars
    val matchMode: MatchMode,   // EXACT, CONTAINS, REGEX
    val enabled: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

enum class MatchMode {
    EXACT,
    CONTAINS,
    REGEX
}
```

**Room Schema:**
```kotlin
@Entity(tableName = "keywords")
data class KeywordEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val word: String,
    val matchMode: String,
    val enabled: Boolean,
    val createdAt: Long
)
```

---

## QA/Test Scenarios

```gherkin
Scenario: Add valid keyword
  Given user is on Keywords screen
  When user adds keyword "OTP" with EXACT mode
  Then keyword appears in list
    And match mode shows "EXACT"

Scenario: Add duplicate keyword
  Given keyword "OTP" already exists
  When user tries to add "OTP" again
  Then error message shown
    And keyword not added

Scenario: Delete keyword with swipe
  Given user is on Keywords screen
  When user swipes left on keyword "OTP"
  Then keyword is removed from list

Scenario: Disable keyword
  Given keyword "OTP" is enabled
  When user toggles it off
  Then SMS containing "OTP" no longer triggers forwarding
```

---

## Related Documentation

- [SMS Monitoring](./sms-monitoring.md) — How SMS are intercepted and passed to the keyword engine
- [Backend Forwarding](./backend-forwarding.md) — How matched SMS are forwarded to your endpoint
- [Forwarding Logs](./forwarding-logs.md) — How forwarding attempts are logged
- [Settings Configuration](./settings-configuration.md) — How to manage all settings
- [System Overview](../architecture/system-overview.md) — High-level architecture

## Dependencies

- Room (local database)
- Kotlin Coroutines + Flow
- Jetpack ViewModel

## Status History

| Date | Status | Notes |
|------|--------|-------|
| 2026-06-05 | Planned | Initial definition |
