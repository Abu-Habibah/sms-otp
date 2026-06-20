# Manual Smoke Test — Android v2.0 Device Claim Flow

**Sprint:** 5 (Android v2.0 Multi-Tenant)
**Date:** 2026-06-10
**Device:** [Your test device]
**Backend:** [Your backend URL]

---

## Prerequisites

- [ ] Backend running (Sprint 3-4 complete)
- [ ] Web admin accessible
- [ ] Test device with Android 8.0+ (API 26+)
- [ ] v2.0 APK installed

---

## Test Scenarios

### Scenario 1: QR Code Claim Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open web admin → Devices → Generate Claim Code | QR code displayed | |
| 2 | Open v2.0 app | Claim Device screen shown | |
| 3 | Tap "Scan QR Code" | Camera permission requested | |
| 4 | Grant camera permission | Camera preview starts | |
| 5 | Scan QR code from web admin | Code detected, loading shown | |
| 6 | Wait for claim to complete | "Device claimed successfully" shown | |
| 7 | App navigates to Dashboard | Dashboard shows "Active" status | |

### Scenario 2: Manual Code Entry Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open web admin → Devices → Generate Claim Code | 8-char code displayed | |
| 2 | Open v2.0 app | Claim Device screen shown | |
| 3 | Tap "Enter Code Manually" | Manual code entry screen shown | |
| 4 | Enter 8-character code | Code input validated | |
| 5 | Tap "Claim Device" | Loading indicator shown | |
| 6 | Wait for claim to complete | "Device claimed successfully" shown | |
| 7 | App navigates to Dashboard | Dashboard shows "Active" status | |

### Scenario 3: SMS Forwarding Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Verify device is claimed | Dashboard shows "Active" | |
| 2 | Add keyword "OTP" via web admin | Keyword synced to device | |
| 3 | Send SMS containing "OTP" to device | SMS received by app | |
| 4 | Check forwarding log | Log shows SUCCESS status | |
| 5 | Check web admin logs | Log entry appears in web UI | |

### Scenario 4: Error Handling

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Enter invalid claim code | Error message shown | |
| 2 | Enter expired claim code | "Code expired" error shown | |
| 3 | Enter already-used code | "Code already used" error shown | |
| 4 | Claim without network | "Network error" message shown | |

### Scenario 5: Security Verification

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Check app version display | Shows "v2.0 (build: X)" | |
| 2 | Verify API key encrypted | Check EncryptedSharedPreferences | |
| 3 | Verify HMAC headers sent | Check network traffic | |
| 4 | Check certificate pinning | Verify in network_security_config.xml | |

### Scenario 6: Revoked Device Reactivation

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Claim device with code A | Device claimed, status ACTIVE | |
| 2 | Revoke device from web admin | Device status shows REVOKED | |
| 3 | Generate new claim code B | New QR code displayed | |
| 4 | Re-claim with same device (same public key) | Device reactivated, status ACTIVE | |
| 5 | Verify same device ID in web admin | No duplicate device created | |

---

## Verification Checklist

### App Launch
- [ ] App launches without crashes
- [ ] Version shows "v2.0 (build: X)"
- [ ] Claim Device screen appears on first launch

### Claim Flow
- [ ] QR scanner works with camera permission
- [ ] Manual code entry validates 8-char input
- [ ] Claim success stores credentials
- [ ] Claim error shows appropriate message

### Dashboard
- [ ] Shows "Active" status after claim
- [ ] Shows correct tenant info
- [ ] Shows correct device info

### SMS Forwarding
- [ ] Keywords sync from backend
- [ ] SMS matching works
- [ ] Forwarding log shows SUCCESS
- [ ] Foreground notification appears (if enabled)

### Settings
- [ ] Backend URL is auto-configured
- [ ] API key is encrypted
- [ ] Device info is stored

---

## Issues Found

| # | Description | Severity | Steps to Reproduce |
|---|-------------|----------|---------------------|
| | | | |

---

## Sign-Off

- [ ] All test scenarios pass
- [ ] No P0/P1 issues found
- [ ] Ready for release

**Tester:** ________________
**Date:** ________________
