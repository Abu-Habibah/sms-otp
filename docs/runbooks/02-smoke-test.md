# Runbook 02 — Manual Smoke Test

## Goal

Verify the full path: a real SMS arrives on a real device → is captured → is forwarded to the backend → the backend posts it to the tenant's `forwardUrl`.

## Prerequisites

- Runbook 01 completed (backend + web + DB all running locally)
- A real Android device (Oppo A15 was used during v1.0 development)
- A way to send an SMS to that device (another phone, or a service)
- The Android app installed, with `RECEIVE_SMS` permission granted
- A keyword configured in the app (e.g. "OTP" with match mode CONTAINS)
- A local HTTP listener ready to receive the forwarded payload (e.g. `nc -l 9999` or `test-backend/server.js`)

## Steps

```bash
# 1. Open the app, go to Settings, set the backend URL to your dev machine
#    e.g. http://192.168.100.10:3000
#    (this is the default; confirm in the Settings screen)

# 2. Open the Keywords screen, add a keyword if you don't have one
#    e.g. word="OTP", matchMode=CONTAINS, enabled=true

# 3. Make sure your listener is running
nc -l 9999   # or: cd test-backend && node server.js

# 4. Update the app's forwarding URL (in Settings) to your listener

# 5. Send an SMS containing the keyword to the device
#    e.g. from another phone: "Your OTP is 123456"

# 6. Within 5 seconds, check:
#    - The Logs screen in the app shows ONE row with status SUCCESS
#    - The listener received a POST with the SMS payload
#    - logcat (adb logcat -s SmsMonitor:D) shows [Broadcast] ✓ Immediate send SUCCEEDED
```

## Pass criteria

- [ ] Exactly ONE log row per SMS (not two)
- [ ] Log status is SUCCESS
- [ ] Backend received the POST
- [ ] Tenant's downstream received the POST
- [ ] No `AndroidRuntime:E` errors in logcat

## Rollback

- If the smoke test fails, capture the logcat output (`adb logcat -d -s SmsMonitor:D AndroidRuntime:E > smoke-fail.log`)
- File a bug in `docs/bugs/` per project-rules Rule 3
- Restore v1.0 if needed: `adb install src-backup/v1.0/app/build/outputs/apk/debug/app-debug.apk` (the APK isn't there in the backup; the v1.0 backup is source-only — but the code path is documented there)
