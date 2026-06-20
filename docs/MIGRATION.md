# Migration Guide: v1.0 → v2.0

**Last Updated:** 2026-06-11

---

## Overview

SMS Monitor v2.0 is a **hard break** from v1.0. The app has been redesigned as a multi-tenant SaaS platform. v1.0 users must reinstall the app and claim their device through the new onboarding flow.

---

## What's Changed

| Feature | v1.0 | v2.0 |
|---------|------|------|
| **Architecture** | Single-tenant, local-only | Multi-tenant SaaS |
| **Authentication** | API key in Settings | HMAC device token (auto-generated) |
| **Keywords** | Local-only | Synced from backend |
| **Backend URL** | Manual entry | Auto-configured during claim |
| **Tenant** | None | Assigned during claim |
| **Forwarding** | Direct HTTP POST | Backend-optimized with retry |
| **Security** | Plain SharedPreferences | EncryptedSharedPreferences |
| **Battery** | WorkManager only | Foreground Service + WorkManager |
| **Onboarding** | None | QR scan or manual code entry |

---

## Migration Steps

### Step 1: Export v1.0 Keywords (Optional)

If you have custom keywords in v1.0, take a screenshot of your keyword list before uninstalling. v2.0 will pull keywords from the backend, but you may want to recreate custom keywords.

### Step 2: Uninstall v1.0

The v1.0 app must be completely uninstalled before installing v2.0. This is required because:
- The app signature may change
- The database schema is incompatible
- The authentication model is different

```bash
adb uninstall com.smsmonitor
```

### Step 3: Install v2.0

Install the v2.0 APK from your preferred source:

```bash
adb install sms-monitor-v2.0.apk
```

### Step 4: Claim Your Device

1. **Open the app** — You'll see the Scan Claim Code screen with camera preview
2. **Choose claim method:**
   - **Scan QR Code (Recommended):** Point camera at QR code from your web admin
   - **Enter Code Manually:** Tap "Enter Code Manually" to enter Server URL + 8-character code
   - **Skip for Now:** Tap "Skip for Now" to explore the app without claiming (claim later from Claim Device card on dashboard)
3. **Wait for claim to complete** — The app will communicate with the backend
4. **Verify success** — You should see "Device Claimed Successfully"
5. **If you skipped:** You can claim later by tapping "Claim Device" on the dashboard or "Re-claim Device" in Settings

### Step 5: Verify Setup

After claiming, verify the following:
- [ ] Dashboard shows "Active" status
- [ ] Keywords appear from backend
- [ ] Settings shows backend URL (auto-configured)
- [ ] Test SMS forwarding works

---

## Troubleshooting

### "Claim code not found or expired"

- **Cause:** The claim code has expired (default: 15 minutes)
- **Solution:** Generate a new claim code from the web admin

### "Claim code already used"

- **Cause:** The claim code has already been used by another device
- **Solution:** Generate a new claim code from the web admin

### "Backend URL not configured"

- **Cause:** The device hasn't been claimed yet
- **Solution:** Complete the claim flow first

### "Network error"

- **Cause:** Cannot reach the backend server
- **Solution:** Check your internet connection and backend URL

### Keywords not syncing

- **Cause:** Backend keyword sync may be delayed
- **Solution:** Pull to refresh on the Keywords screen, or wait a few seconds

---

## New Features in v2.0

### Device Management
- View all your devices in the web admin
- Suspend/resume/revoke devices remotely
- Track device activity with heartbeats

### Keyword Sync
- Keywords are now managed in the web admin
- Changes sync to all your devices automatically
- Support for more match modes (AT_START, AT_END)

### Improved Security
- API keys are encrypted at rest
- HMAC signing for all device communication
- Certificate pinning (coming soon)

### Better Reliability
- Foreground service ensures forwarding survives battery optimization
- Improved retry logic with exponential backoff
- Better OEM compatibility (ColorOS, EMUI, MIUI)

---

## Support

If you encounter issues during migration:

1. Check the [Troubleshooting](#troubleshooting) section
2. Visit the web admin for device status
3. Contact support with your device ID and error details

---

## Related Documentation

- [v2.0 Architecture](../architecture/v2.0-overview.md) — Technical details
- [Android Enhancements](../features/android-enhancements.md) — New features
- [Sprint 5 Plan](../sprints/v2.0/sprint-5-android-v2.md) — Implementation details
