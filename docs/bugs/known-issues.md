# Known Issues

A running list of known issues, workarounds, and the sprint in which each is scheduled to be addressed.

---

## Active

### KI-001 — ColorOS / Oppo freezes the v1.0 app process when screen is off

- **Severity:** High
- **Affects:** v1.0 (Android, alpha-35 and earlier)
- **Discovered:** 2026-06-08, during F-SP45-T4 testing
- **Symptom:** SMS is captured (PENDING log row appears) but never forwarded to the backend. WorkManager job is enqueued but never executes — `OplusHansManager` (Oppo's battery manager) freezes the process when the screen turns off, putting the app into the `RARE` standby bucket with background-work quotas exhausted.
- **Workaround for v1.0:** User must:
  1. Settings → Apps → SMS Monitor → Battery → "Don't optimize"
  2. Settings → App Management → SMS Monitor → "Allow Auto-start"
  3. Lock the app in Recents
- **Permanent fix:** In v2.0 of the Android app, the receiver does the HTTP send in-process (F-SP45-T4, alpha-35+). The `SmsHttpSender` is invoked from the `BroadcastReceiver` itself before the worker is enqueued, so the freeze can't happen between SMS capture and the HTTP call.
- **Tracked in:** F-SP45-T4 (Sprint 4.5 — Bugfixes & UX Tweaks), shipped in v0.1.5

### KI-002 — `pm clear` is blocked by the device's `pm` security guard on ColorOS

- **Severity:** Low
- **Affects:** Dev workflow only
- **Symptom:** `adb shell pm clear com.smsmonitor` throws `SecurityException: ... does not have permission android.permission.CLEAR_APP_USER_DATA`
- **Workaround:** Use `adb shell pm uninstall com.smsmonitor` + reinstall. Same effect on the data directory.
- **Permanent fix:** None planned — this is a device-side permission quirk, not an app bug.

---

## Resolved

_Moved to [`resolved.md`](./resolved.md) once fixed in a shipped version._

---

## Reporting a new issue

Per project-rules Rule 3, every bug gets a `docs/bugs/<bug-id>-<short-title>.md` file with the standard template. The issue is also listed here with a one-line summary.
