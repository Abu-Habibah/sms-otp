# Runbook: Smoke Test (Pre-Release)

Run this checklist before tagging any release that touches the SMS pipeline.

---

## Prerequisites

- [ ] A real Android device with the v2.0+ app installed and granted `RECEIVE_SMS`
- [ ] A second phone (or a web SMS-sender service) to send test SMS to the device
- [ ] The dev backend running locally: `pnpm dev:infra && pnpm --filter backend start:dev`
- [ ] A test tenant + at least one active device, set up via the web admin

## Steps

1. **Backend health** — `curl http://localhost:6001/health` returns `200` with `db: "up"`
2. **Web admin loads** — `http://localhost:6002` renders the landing page, no console errors
3. **Device is ACTIVE** — in the web admin's Devices page, the device shows status `ACTIVE` and `lastSeenAt` within the last 5 minutes
4. **Keyword configured** — at least one keyword exists for the tenant
5. **Send a real SMS** from the second phone to the device's number, with body containing the keyword (e.g. `Your OTP is 654321` if keyword is `OTP`)
6. **Wait 10 seconds** (the receiver does the immediate send, then the worker confirms in the DB)
7. **Backend received it** — `GET http://localhost:6001/v1/sms-logs?tenantId=...` shows a row with `status: FORWARDED`
8. **Tenant downstream received it** — if the tenant's `forwardUrl` is set, the receiving service shows the SMS

## Pass criteria

- All 8 steps above pass without errors
- No `AndroidRuntime:E` in `adb logcat -s SmsMonitor:*` during the test
- No `Failed` rows in the web admin's Logs page

## Fail handling

If any step fails:
1. Capture logcat from the device, the backend stdout, and a screenshot of the web admin
2. Open a `docs/bugs/<bug-id>-<title>.md` per project-rules Rule 3
3. Add the symptom to `docs/bugs/known-issues.md`
4. Block the release until the bug is fixed

## Post-test cleanup

- [ ] Delete the test SMS rows from the DB (or mark them as test in the schema)
- [ ] Revoke the test device if it was created just for the smoke test
- [ ] Re-arm any feature flags that were toggled
