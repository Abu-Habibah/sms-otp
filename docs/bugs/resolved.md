# Resolved Issues

Bugs that have been fixed in a shipped version. Kept here for regression reference.

_Format: `<bug-id>` → `<fix-version>` — `<one-line summary>`_

### v2.0 Bugfixes

- **Keyword sync format mismatch** → v2.0 (Sprint 8+) — Backend `GET /v1/keywords` now wraps response in `{keywords: [...]}` matching Android client expectation
- **Device revoke HTTP method** → v2.0 (Sprint 8+) — Frontend now uses `DELETE /v1/devices/:id` instead of `POST` for device revocation
- **Launch sync timestamp** → v2.0 (Sprint 8+) — `lastKeywordSyncTime` updated after successful sync, preventing double sync on every launch
- **Device info missing on claim** → v2.0 (Sprint 8+) — `DeviceInfoCollector` now injected in both `ClaimCodeScannerActivity` and `ManualCodeEntryActivity` to collect hardware info during claim
- **Docker port mapping** → v2.0 (Sprint 8+) — Web container port mapping corrected from `3001:6001` to `3001:6002`
- **Public key reactivation** → v2.0 (Sprint 8+) — Revoked devices can now be re-activated by re-claiming with the same public key
