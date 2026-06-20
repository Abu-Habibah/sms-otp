# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed — prompt-rules Skill v1.1 (Build: 002)

**prompt-rules upgraded to v1.1 (Build: 002).** Adds system filtering to Phase 1 (prompt discovery) — the executor now only shows prompts matching the session's assigned system. Build only bump per Decision Matrix (fix → Build only).

**File:** `.opencode/skills/prompt-rules/SKILL.md` — 620 lines, SHA256: `CD4C8C99C6CA0CDBD5A7CEF757CBAA86B33A8D96402FBEA62235A258A618F5E6` (matches opencodeGate source).

#### What changed in Build: 002

**Phase 1: Discover All Pending** — new step 4:
```
4. **Filter by session system** (NEW):
   - Read `.sisyphus/session-state.json` if exists
   - If `assigned_system` is set → keep only prompts where `system == assigned_system`
   - If no session state → keep all prompts (with warning)
   - Log filter count: "Discovered: N, Kept: M, Filtered: K"
```

**Why this matters:** In multi-system projects (web, be, an-monitor, etc.), a session assigned to `be` should not see or execute `web-*` prompts. The filter prevents accidental cross-system execution and reduces noise in batch execution.

**Backup:** Previous version saved as `.opencode/skills/prompt-rules/SKILL.md.bak`.

### Added — prompt-rules Skill v1.1 (Build: 001)

**New skill: prompt-rules v1.1 (Build: 001) — structured prompt generation & execution management.** Adds two safety features that prevent cross-system execution errors in multi-system projects. Build only bump per Decision Matrix (config/setup → Build only).

**File:** `.opencode/skills/prompt-rules/SKILL.md` — 600 lines, 2 rules, SHA256: `3573C4C1A748AFB7A08A303762ACC123C9606C22987ABB8A21F53A7961CD1D3B` (matches opencodeGate source).

#### New features in v1.1 (Build: 001)

1. **Session System Assignment** — When a user assigns a session to a specific system (e.g., "this session works on `be` only"), the agent writes to `.sisyphus/session-state.json`:
   ```json
   {
     "session_id": "<current session ID>",
     "assigned_system": "<prefix>",
     "assigned_at": "<ISO 8601>",
     "assigned_by": "user instruction",
     "original_instruction": "<verbatim instruction>"
   }
   ```
   All subsequent prompt executions within the session check this file before running.

2. **Phase 0: Pre-Execution Validation (MANDATORY)** — Before executing ANY prompt:
   - Reads `.sisyphus/session-state.json` if it exists
   - Compares prompt's system with session's `assigned_system`
   - **Blocks execution** on system mismatch
   - Verifies system prefix exists in README.md
   - Checks required files exist for MODIFY/REFERENCE actions
   - Warns if cross-project execution detected
   - **Do NOT proceed until all validations pass or user overrides**

#### System Prefix Dependency

The skill does **not** define its own system prefix table. All `system` fields reference the authoritative table defined by the `project-rules` skill (Rule 9: Sprint & Task File Naming Convention). This skill depends on `project-rules` being installed.

#### Registered in opencode.json

Added `skills.prompt-rules` block with `enabled: true` and trigger phrases.

### Added — sync-skill Prompt Template

**New agent prompt template for cross-project skill synchronization.** Reusable prompt that compares SKILL.md files between a source and target project, diffs content by section, applies missing/outdated sections from source to target, and preserves target-specific customizations. Build only bump per Decision Matrix (config/setup → Build only).

- **`.opencode/prompts/sync-skill.md`** — 197-line prompt template with:
  - 3 parameters (skill_name, source_path, target_path)
  - 5-step workflow (read → read → diff → apply → report)
  - Section-level comparison table (match/outdated/missing/custom)
  - Customization markers (`<!-- custom: ... -->` / `<!-- end custom -->`)
  - 3 usage patterns: single agent delegation, quick sync, batch parallel sync
  - Troubleshooting table for common failure modes

**Usage:**
```typescript
task(
  category="unspecified-high",
  load_skills=["project-rules"],
  run_in_background=false,
  description="Sync project-rules skill",
  prompt="[copy from sync-skill.md, fill parameters]"
)
```

### Added — User-Editable Device Name

**Device name is now user-editable in Settings.** The device name appears in forwarding logs and web admin, allowing users to identify devices by custom names (e.g., "Reception Phone", "HR Device").

#### Android Changes

- **`SettingsRepository.kt`** — Added `deviceName` field with encrypted storage (default: "SMS Monitor Device")
- **`SettingsActivity.kt`** — Added device name input field and save logic
- **`activity_settings.xml`** — Added "Device Name" card with input field
- **`SmsHttpSender.kt`** — Updated forwarding payload to use custom device name instead of hardcoded "SMS Monitor Device"

### Fixed — Keyword Sync Response Format

**Keywords now sync correctly from backend to Android.** The backend `GET /v1/keywords` now wraps the response in `{keywords: [...]}` matching the Android client's expected format.

#### Backend
- **`backend/src/keywords/keywords.controller.ts`** — `list()` now returns `{keywords: keywords}` wrapper

### Fixed — Device Info Now Collected During Claim

**Device hardware information (SIM, model, OS) is now collected and sent during device claim.** Previously, device info was only sent during heartbeats, causing devices to show "Claimed Device" until the first heartbeat.

#### Android
- **`app/.../claim/ClaimCodeScannerActivity.kt`** — Injected `DeviceInfoCollector`, passes `collectDeviceInfoWithSim()` during QR claim
- **`app/.../claim/ManualCodeEntryActivity.kt`** — Same for manual claim flow
- **`app/.../MainActivity.kt`** — Updates `lastKeywordSyncTime` after successful sync, preventing double sync

### Added — Device Detail Modal

**Clicking a device row now opens a detail modal** showing all device information: manufacturer, model, OS version, app version, SIM 1/2 numbers, status, last seen, and creation date.

#### Web Admin
- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added `DeviceDetailModal` with all device fields; device rows are now clickable

### Added — Extended Device Type

**Shared Device type now includes SIM numbers, device model, Android version, and last heartbeat timestamp.**

#### Shared Types
- **`packages/shared-types/src/index.ts`** — Added `simSlot1Number`, `simSlot2Number`, `deviceModel`, `androidVersion`, `lastHeartbeat` to `deviceSchema`

### Fixed — Dead Code Removal

**Removed dead `updateLastSyncTime()` method** in `KeywordSyncService` that was never called. Timestamp updates now happen in `MainActivity` and `HeartbeatService`.

#### Android
- **`app/.../data/repository/KeywordSyncService.kt`** — Removed dead method

### Changed — Simplified Signup Flow

**Signup no longer requires tenant slug.** Users enter name, email, and password only. Tenant slug is auto-generated from the email domain.

#### Backend
- **`backend/src/auth/auth.service.ts`** — `signup()` auto-generates slug from email domain
- **`backend/src/auth/auth.controller.ts`** — Updated signup endpoint

#### Web Admin
- **`web/app/(auth)/signup/SignupForm.tsx`** — Removed tenant slug field
- **`web/app/api/auth/signup/route.ts`** — Updated proxy

### Changed — Sidebar Navigation

**Tenants menu removed, Workspaces repositioned.** New sidebar order: Home → Workspaces → Devices → Keywords → SMS Logs → Users.

#### Web Admin
- **`web/app/(dashboard)/layout.tsx`** — Removed Tenants, reordered navigation

### Added — Dashboard Statistics

**Dashboard now shows real-time counts** for workspaces, devices, keywords, SMS messages, plus latest SMS preview.

#### Web Admin
- **`web/app/(dashboard)/dashboard/page.tsx`** — Fetches workspaces, devices, keywords, sms-logs

### Added — Workspace Settings with URL Validation

**Workspace settings now include Public API URL and Forward URL (Webhook)** with Test buttons to verify reachability.

#### Backend
- **`backend/src/health/health.controller.ts`** — Added `POST /health/check-url`

#### Web Admin
- **`web/app/(dashboard)/workspaces/[id]/tabs/SettingsTab.tsx`** — Added Public API URL, Forward URL (Webhook), Test buttons

### Added — User Guide

**Comprehensive user guide** accessible from the landing page at `/user-guide`.

#### Web Admin
- **`web/app/user-guide/page.tsx`** — User guide with installation, configuration, usage, troubleshooting

### Added — User Invite from Workspace Settings

**Admins can add users directly via modal** with email, name, role, and temporary password.

#### Web Admin
- **`web/app/(dashboard)/tenants/TenantsClient.tsx`** — Added InviteUserModal with "Add User" button

### Fixed — Docker Port Mapping

**Web container port mapping corrected** from `3001:3000` to `3001:3001` to match the Dockerfile `PORT=3001` setting.

#### Infrastructure
- **`docker-compose.yml`** — Updated web port mapping
- **`docker/services/web/Dockerfile`** — Added `ENV PORT=3001`

### Added — Revoked Device Reactivation

**Revoked devices can now be re-activated by re-claiming with the same public key.** When a device with an existing public key reclaims while in REVOKED status, the backend reactivates it (status → ACTIVE, device info updated, new claim code consumed) instead of creating a duplicate.

#### Backend
- **`backend/src/devices/devices.service.ts`** — Added public key lookup + reactivation logic in `claim()` method

#### Documentation
- **`docs/features/claim-codes.md`** — Added AC-7a reactivation acceptance criteria
- **`docs/features/devices.md`** — Updated AC-7 (REVOKED can be reactivated) and AC-11

### Fixed — QR Code Documentation

**QR payload format updated** across documentation to include `workspaceId` and use query params (not path params).

#### Documentation
- **`docs/features/claim-codes.md`** — Updated QR format to include workspaceId
- **`docs/features/device-onboarding.md`** — Updated QR payload format
- **`docs/sprints/v2.0/sprint-2-devices-claim-codes.md`** — Fixed path format

### Fixed — E2E Tests (All 34 Passing)

**All 34 e2e tests now pass.** Fixed email uniqueness, workspace creation, rate limiting, and tenant slug assertions.

#### Test Files
- **`backend/test/auth-tenants.e2e-spec.ts`** — Updated slug expectations
- **`backend/test/devices-claim-codes.e2e-spec.ts`** — Added workspace creation
- **`backend/test/keywords.e2e-spec.ts`** — Added workspaceId to requests
- **`backend/test/sms-ingest.e2e-spec.ts`** — Added workspace and tenantId
- **`backend/test/setup-env.ts`** — New file, sets `THROTTLE_LIMIT=1000`

#### Source Files
- **`backend/src/app.module.ts`** — Throttle limit from env
- **`backend/src/auth/auth.controller.ts`** — Per-route throttle from env

### Added — Device Revoke & Display Improvements

**Device revoke fixed** (DELETE method vs POST). **Device display improved** with model/manufacturer info.

#### Web Admin
- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Fixed revoke method, improved display, added "Show revoked" toggle

## [v2.4] (Build: 001) — 2026-06-18

### Added — Device Name Editing

**Admins can now edit device names inline.** Hover over device name, click edit icon, type new name, press Enter to save.

#### Web Admin

- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added inline name editing with Edit3 icon, input field, and save/cancel buttons
- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — Same inline name editing for workspace devices tab

### Added — Reactivate Revoked Devices

**Admins can reactivate revoked devices.** Revoked devices now show a Reactivate button that restores them to ACTIVE status.

#### Backend

- **`backend/src/devices/devices.service.ts`** — Added `reactivate()` method
- **`backend/src/devices/devices.controller.ts`** — Added `POST /v1/devices/:id/reactivate` endpoint (OWNER/ADMIN only)

#### Web Admin

- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added Reactivate button for REVOKED devices
- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — Added Reactivate button for REVOKED devices

### Fixed — Device Schema Null Validation

**Devices with null optional fields no longer fail Zod validation.** Changed all `.optional()` string fields to `.nullish()` to handle Prisma null values.

#### Shared Types

- **`packages/shared-types/src/index.ts`** — Changed `deviceSchema` optional string/datetime fields from `.optional()` to `.nullish()` (manufacturer, model, osVersion, appVersion, simSlot1Number, simSlot2Number, deviceModel, androidVersion, lastHeartbeat, lastSeenAt, identifyRequestedAt, identifyAckedAt)

## [v2.3] (Build: 004) — 2026-06-17

### Fixed — Device Schema Null Validation

**Devices with null optional fields no longer fail Zod validation.** Changed all `.optional()` string fields to `.nullish()` to handle Prisma null values.

#### Shared Types

- **`packages/shared-types/src/index.ts`** — Changed `deviceSchema` optional string/datetime fields from `.optional()` to `.nullish()` (manufacturer, model, osVersion, appVersion, simSlot1Number, simSlot2Number, deviceModel, androidVersion, lastHeartbeat, lastSeenAt, identifyRequestedAt, identifyAckedAt)

## [v2.3] (Build: 003) — 2026-06-17

### Fixed — Device Revoke on Workspace Devices Tab

**Revoke now works on workspace detail page.** Was sending POST instead of DELETE.

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — Fixed `handleAction` to use `DELETE /v1/devices/:id` for revoke (was always POST)

## [v2.3] (Build: 002) — 2026-06-17

### Fixed — Settings Persistence for Public API URL

**Public API URL now persists after save.** QR code immediately reflects the new URL.

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/WorkspaceDetailClient.tsx`** — Added `useState` for `tenantPublicApiUrl` and passed `onPublicApiUrlChange` callback to `SettingsTab`

## [v2.3] (Build: 001) — 2026-06-15

### Added — Countdown Timer for Claim Code Expiration

**Claim code modal now shows live countdown timer.** Instead of static expiration time, users see a live countdown that updates every second.

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — Updated `GenerateCodeModal` with `useEffect` and `setInterval` for live countdown display (M:SS format)

### Fixed — Public API URL Test Button

**Test button on workspace settings now works.** Was calling wrong endpoint path.

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/tabs/SettingsTab.tsx`** — Changed test URL from `/api/v1/health/check-url` to `/api/health/check-url` (correct endpoint path)
- **`web/app/api/v1/[...path]/route.ts`** — Health endpoints now bypass JWT check (they're `@Public()` on backend)

**Claim code modal now shows live countdown timer.** Instead of static expiration time, users see a live countdown that updates every second.

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — Updated `GenerateCodeModal` with `useEffect` and `setInterval` for live countdown display (M:SS format)

## [v2.2] (Build: 005) — 2026-06-15

### Added — Workspace Management UI (Sprint 9 Tasks 11-13)

**Web admin now supports workspace management.** Users can create, edit, and delete workspaces, manage members with role-based access, and view workspace-scoped devices and keywords.

#### Web Admin — Workspace List (`web/app/(dashboard)/workspaces/`)

- **`page.tsx`** — Server component fetching workspace list via `GET /v1/workspaces`
- **`WorkspacesClient.tsx`** — Full CRUD: create, edit, delete workspaces with modal forms, empty state CTA, table view. Workspace names are clickable links to detail page.

#### Web Admin — Workspace Detail (`web/app/(dashboard)/workspaces/[id]/`)

- **`page.tsx`** — Server component fetching workspace by ID
- **`WorkspaceDetailClient.tsx`** — Tab-based detail view (Devices, Keywords, Members, Settings)
- **`tabs/DevicesTab.tsx`** — Workspace-scoped device list with generate claim code modal (includes workspaceId in QR payload)
- **`tabs/KeywordsTab.tsx`** — Workspace-scoped keyword management with add/edit/delete
- **`tabs/MembersTab.tsx`** — Member management: add by email, change roles, remove members
- **`tabs/SettingsTab.tsx`** — Edit workspace name, forward URL, retention days

### Added — Workspace-Scoped Device Claim (F-SP9-T24, F-SP9-T25)

**QR codes now include workspaceId.** Device claim codes are workspace-scoped.

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — QR payload includes `workspaceId`: `{origin}/v1/claim?code={code}&workspaceId={id}`
- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Removed claim modal (Option A), shows "Go to Workspaces" redirect message

### Added — Device Identification UI (F-DEVICE-ID)

**Admins can now identify physical devices from the web admin.** Click "Identify" button to trigger visual indicator on the Android app.

#### Web Admin

- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added Identify button (Radio icon) for ACTIVE devices with loading/success states
- **`web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`** — Same identify functionality for workspace devices tab
- **`packages/shared-types/src/index.ts`** — Added `identifyRequestedAt` and `identifyAckedAt` optional datetime fields to `deviceSchema`

### Added — Workspace Filtering for Devices & SMS Logs

**Devices and SMS Logs pages now support workspace filtering.**

#### Web Admin

- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added workspace selector dropdown (like Keywords page)
- **`web/app/(dashboard)/sms-logs/SmsLogsClient.tsx`** — Added workspace selector dropdown as additional filter alongside status filter

### Changed — Login Simplification

- **`web/app/(auth)/login/LoginForm.tsx`** — Removed tenant slug field (auto-detected from email)
- **`backend/src/auth/auth.service.ts`** — Login now accepts optional `tenantSlug`; auto-detects tenant from email if not provided
- **`packages/shared-types/src/index.ts`** — `tenantSlug` field in `loginSchema` is now optional

### Changed — Workspace Slug Removal

- **`backend/src/workspaces/workspace.service.ts`** — Removed slug from create/update; name uniqueness enforced instead
- **`packages/shared-types/src/index.ts`** — Removed `slug` from `workspaceSchema`, `createWorkspaceSchema`
- **`web/app/(dashboard)/workspaces/WorkspacesClient.tsx`** — Removed slug from create form and table
- **`web/app/(dashboard)/workspaces/[id]/tabs/SettingsTab.tsx`** — Removed slug display field

### Fixed — Login Redirect Bug

- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Removed `router.refresh()` from GenerateCodeModal `onClose` handler (was triggering server component redirect to login)
- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added `if (!open) return null` guard to GenerateCodeModal (was always rendering UI)
- **`web/app/(dashboard)/workspaces/page.tsx`** — Removed `redirect('/login')` on API failure (shows error banner instead)

### Fixed — Workspace Backend 500 Error

- **`backend/src/workspaces/workspace.service.ts`** — Changed all `this.prisma.userWorkspace.*` calls to `this.raw.userWorkspace.*` (UserWorkspace model has no tenantId column, TenantScopedPrismaService was injecting invalid field)

### Fixed — Zod Validation for Nullable Fields

- **`packages/shared-types/src/index.ts`** — Changed `forwardUrl` from `.optional()` to `.nullish()` in `workspaceSchema` (Prisma returns `null` for nullable fields, not `undefined`)

## [v2.1] (Build: 004) — 2026-06-14

### Added — Sprint 9: Android Workspace Claim & Settings (F-SP9-T14, F-SP9-T15)

**Android app now collects device hardware info and responds to identification requests.** Admins can see detailed device info and visually identify physical devices.

#### New Files

##### Utilities

- **`app/src/main/java/com/smsmonitor/util/DeviceInfoCollector.kt`** — Utility class to collect device hardware info: manufacturer, model, OS version, app version, SIM numbers. Handles permissions gracefully.

##### Services

- **`app/src/main/java/com/smsmonitor/app/service/DeviceIdentificationService.kt`** — Foreground service that checks for identification requests on heartbeat, shows visual indicator (vibration + notification), and acknowledges identification.

#### Updated Files

##### Claim Flow

- **`ClaimService.kt`** — Added `ClaimDeviceInfo` data class with manufacturer, model, OS version, app version, SIM numbers. Updated `ClaimRequest` to include `deviceInfo`.
- **`ClaimCodeScannerActivity.kt`** — Collects device info using `DeviceInfoCollector` and includes in claim request.

##### Heartbeat

- **`HeartbeatService.kt`** — Updated to include device info in heartbeat payload. Starts `DeviceIdentificationService` on creation.

##### Manifest

- **`AndroidManifest.xml`** — Added `VIBRATE` and `READ_PHONE_STATE` permissions. Added `DeviceIdentificationService` declaration.

### Changed — Sprint 8: DELETE /v1/claim-codes/:id (Tasks 1-3)
| POST | `/v1/auth/login` | Login (email, password) |
| POST | `/v1/auth/refresh` | Refresh JWT token |
| POST | `/v1/auth/logout` | Logout (clear cookies) |
| POST | `/v1/users` | Invite/add user to tenant |

#### Backend

- **`backend/src/auth/auth.service.ts`** — `signup()` no longer requires `tenantSlug`; auto-generates slug from email domain (e.g., `alice@acme.com` → slug `acme`)
- **`backend/src/auth/auth.controller.ts`** — Updated signup endpoint: accepts `{name, email, password}` only

#### Web Admin

- **`web/app/(auth)/signup/SignupForm.tsx`** — Removed tenant slug field from signup form
- **`web/app/api/auth/signup/route.ts`** — Updated proxy to match new signup payload

### Added — User Invite from Tenant Settings

**Admins can now add users directly from the tenant settings page.** An "Add User" button opens a modal to invite new users with email, name, role, and temporary password.

#### Web Admin

- **`web/app/(dashboard)/tenants/TenantsClient.tsx`** — Added `InviteUserModal` component; added "Add User" button to tenant page header

### Fixed — Keyword Creation Requires workspaceId

**Fixed foreign key constraint error when creating keywords.** The backend now requires `workspaceId` in the request body when creating keywords.

#### Backend API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/keywords` | Create keyword (requires `workspaceId` in body) |
| GET | `/v1/keywords` | List keywords |
| PATCH | `/v1/keywords/:id` | Update keyword |
| PATCH | `/v1/keywords/:id/toggle` | Toggle keyword enabled/disabled |
| DELETE | `/v1/keywords/:id` | Delete keyword |

#### Backend

- **`backend/src/keywords/keywords.controller.ts`** — Added `workspaceId` to create body type
- **`backend/src/keywords/keywords.service.ts`** — Uses `workspaceId` from body or tenant context; throws error if missing

### Changed — Sidebar Navigation (Tenant Menu Removed)

**Sidebar navigation updated.** Tenants menu removed from sidebar. Workspaces menu moved to second position (after Home).

#### Web Admin

- **`web/app/(dashboard)/layout.tsx`** — Removed Tenants menu item; reordered: Home → Workspaces → Devices → Keywords → SMS Logs → Users

### Enhanced — Dashboard Home Page

**Home page now shows real-time statistics.** Displays workspace, device, keyword, and SMS counts with latest SMS preview.

#### Web Admin

- **`web/app/(dashboard)/dashboard/page.tsx`** — Fetches workspaces, devices, keywords, sms-logs; shows count cards for each; displays latest SMS with sender, message, and matched keyword; shows forwarding status and settings summary

### Added — URL Validation in Workspace Settings

**Workspace settings now include Test buttons for URL validation.** Admins can verify Public API URL and Forward URL (Webhook) are reachable before saving.

#### Backend API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/health/check-url` | Public | Check if URL is reachable (5s timeout) |

#### Web Admin

- **`web/app/(dashboard)/workspaces/[id]/tabs/SettingsTab.tsx`** — Added "Test" buttons next to Public API URL and Forward URL (Webhook) fields; shows validation status icons (checkmark, X, warning)
- **`web/app/api/health/check-url/route.ts`** — New proxy route for health check endpoint

### Added — Sprint 9: Web Workspace Management UI (F-SP9-T11, F-SP9-T12, F-SP9-T13)

**Web admin now supports workspace management.** Users can create, edit, and delete workspaces, manage members with role-based access, and view workspace-scoped devices and keywords.

#### Backend API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/workspaces` | JWT, OWNER/ADMIN | Create workspace |
| GET | `/v1/workspaces` | JWT | List user's workspaces |
| GET | `/v1/workspaces/:id` | JWT | Get workspace |
| PATCH | `/v1/workspaces/:id` | JWT, OWNER/ADMIN | Update workspace |
| DELETE | `/v1/workspaces/:id` | JWT, OWNER | Delete workspace |
| GET | `/v1/workspaces/:id/devices` | JWT | List workspace devices |
| GET | `/v1/workspaces/:id/keywords` | JWT | List workspace keywords |
| GET | `/v1/workspaces/:id/sms-logs` | JWT | List workspace SMS logs |
| GET | `/v1/workspaces/:id/members` | JWT, OWNER/ADMIN | List workspace members |
| POST | `/v1/workspaces/:id/members` | JWT, OWNER/ADMIN | Add workspace member |
| PATCH | `/v1/workspaces/:id/members/:userId` | JWT, OWNER | Change member role |
| DELETE | `/v1/workspaces/:id/members/:userId` | JWT, OWNER | Remove member |

#### Shared Types

- **`packages/shared-types/src/index.ts`** — Added `WorkspaceRole` enum, `workspaceSchema`, `createWorkspaceSchema`, `updateWorkspaceSchema`, `userWorkspaceSchema`, `addMemberSchema`, `updateMemberRoleSchema`

#### Web Admin — Workspace List (`web/app/(dashboard)/workspaces/`)

- **`page.tsx`** — Server component fetching workspace list via `GET /v1/workspaces`
- **`WorkspacesClient.tsx`** — Full CRUD: create, edit, delete workspaces with modal forms, empty state CTA, table view

#### Web Admin — Workspace Detail (`web/app/(dashboard)/workspaces/[id]/`)

- **`page.tsx`** — Server component fetching workspace by ID
- **`WorkspaceDetailClient.tsx`** — Tab-based detail view (Devices, Keywords, Members, Settings)
- **`tabs/DevicesTab.tsx`** — Workspace-scoped device list with generate claim code modal (includes workspaceId)
- **`tabs/KeywordsTab.tsx`** — Workspace-scoped keyword management with add/edit/delete
- **`tabs/MembersTab.tsx`** — Member management: add by email, change roles, remove members
- **`tabs/SettingsTab.tsx`** — Edit workspace name, forward URL, retention days

#### Web Admin — Updated Components

- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Added optional `workspaceId` prop for workspace-scoped device fetching and claim code generation
- **`web/app/(dashboard)/keywords/KeywordsClient.tsx`** — Added optional `workspaceId` prop for workspace-scoped keyword fetching and creation
- **`web/app/(dashboard)/tenants/TenantsClient.tsx`** — Added Workspaces link button per tenant row
- **`web/app/(dashboard)/layout.tsx`** — Added Workspaces to sidebar navigation

### Added — Sprint 9: Android Workspace Claim & Settings (F-SP9-T14, F-SP9-T15)

**Android app now supports workspace-scoped device claim.** QR codes can include workspaceId, and the settings screen displays workspace information.

#### Android — `app/src/main/java/com/smsmonitor/`

##### Claim Flow (`app/claim/`)

- **`ClaimCodeScannerActivity.kt`** — Updated to parse `workspaceId` from QR code query parameter (`?code=XYZ&workspaceId=WS123`)
- **`ManualCodeEntryActivity.kt`** — Existing Server URL field; workspaceId auto-extracted from claim response

##### Data Layer (`data/repository/`)

- **`SettingsRepository.kt`** — Added `workspaceId` and `workspaceName` fields with encrypted storage
- **`ClaimService.kt`** — Updated `ClaimResponse` and `ClaimDevice` data classes to include `workspaceId` and `workspaceName`; saves workspace info after successful claim

##### Settings (`app/settings/`)

- **`SettingsActivity.kt`** — Updated `showDeviceInfo()` to display workspace name
- **`activity_settings.xml`** — Added workspace name row in device info card

#### Documentation

- **`docs/features/workspaces.md`** — Updated status
- **`docs/sprints/v2.0/sprint-9-workspaces.md`** — F-SP9-T14, F-SP9-T15 marked ✅

### Added — Tenant Public API URL Configuration (v2.0 Build: 003)

**Tenants can now configure a public API URL for QR code generation.** This ensures Android devices receive the correct external URL when scanning QR codes, regardless of the internal Docker network topology.

#### Database

- **`backend/prisma/schema.prisma`** — Added `publicApiUrl String?` field to Tenant model

#### Backend

- **`backend/src/tenants/tenants.service.ts`** — Added `publicApiUrl` to `CreateTenantInput` interface, create, and update methods
- **`packages/shared-types/src/index.ts`** — Added `publicApiUrl` to `tenantSchema`

#### Web Admin

- **`web/app/(dashboard)/tenants/TenantsClient.tsx`** — Added EditTenantModal with "Public API URL" input field; auto-detect placeholder uses `window.location.origin`
- **`web/app/(dashboard)/devices/page.tsx`** — Fetches tenant data via `GET /v1/tenants/me` and passes `publicApiUrl` to DevicesClient
- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — QR code now uses `tenant.publicApiUrl` with fallback to `window.location.origin`
- **`web/app/(dashboard)/dashboard/page.tsx`** — Added `publicApiUrl` to inline tenant schema

#### Bug Fixes

- **`packages/shared-types/src/index.ts`** — Fixed `deviceSchema` to use `name` (matching Prisma model) instead of `displayName`
- **`web/app/(dashboard)/devices/DevicesClient.tsx`** — Fixed `device.displayName` → `device.name` references
- **`web/app/(dashboard)/devices/page.tsx`** — Fixed schema validation to accept flat array from backend
- **`web/app/(dashboard)/tenants/page.tsx`** — Fixed schema validation to accept flat array from backend
- **`web/app/(dashboard)/users/page.tsx`** — Fixed schema validation to accept flat array from backend
- **`web/app/api/v1/[...path]/route.ts`** — Fixed to use `BACKEND_URL` (server-side) instead of `NEXT_PUBLIC_API_BASE_URL` (build-time inlined)

**Login was broken — users could sign in but were immediately redirected back to the login page.** Two root causes:

1. **Cookie forwarding** — Login API route used `headers.get('set-cookie')` which mashes both cookies into one string. The regex split couldn't reliably parse commas inside `Expires` dates. Fixed to use `headers.getSetCookie()` (returns array), matching the signup route.

2. **Dashboard schema mismatch** — `MeResponseSchema` used shared-types `UserSchema`/`TenantSchema` which expect `displayName`/`emailVerified`/`plan`, but the backend returns `name`/`emailVerifiedAt` (no `plan`). Zod validation silently failed → redirect to login. Fixed with inline schema matching actual backend response.

#### Changes

- **`web/app/api/auth/login/route.ts`** — Use `getSetCookie()` instead of regex split
- **`web/app/(dashboard)/dashboard/page.tsx`** — Inline MeResponseSchema matching actual `/v1/me` response
- **`web/app/(auth)/login/page.tsx`** — Read version from `version.json` (was hardcoded)
- **`web/app/(auth)/signup/page.tsx`** — Read version from `version.json` (was hardcoded)
- **`web/version.json`** — Bumped to `v2.0 (Build: 002)`

### Added — Sprint 8: DELETE /v1/claim-codes/:id (Tasks 1-3)

**Sprint 8 Tasks 1-3 complete the claim code cancel endpoint.** This was the last missing endpoint from the documented API surface.

#### Backend — `backend/src/`

##### Claim Codes (`claim-codes/`)

- **`claim-codes.service.ts`** — Added `cancel(id, tenantId)` method: finds code by ID, verifies tenant ownership (404 if not), rejects used codes (409), sets `expiresAt = now()` for unused codes
- **`claim-codes.controller.ts`** — Added `DELETE /v1/claim-codes/:id` endpoint with `@Roles('OWNER', 'ADMIN')` decorator, `@HttpCode(204)`, tenant context isolation

##### E2E Tests — `backend/test/`

- **`devices-claim-codes.e2e-spec.ts`** — Added 3 test cases for AC-10:
  - Happy path: cancel unused code returns 204, code expires
  - 409 Conflict: cancel used code returns 409
  - 404 Not Found: cancel code from different tenant returns 404

#### Documentation

- **`docs/features/claim-codes.md`** — AC-10 marked as implemented
- **`docs/sprints/v2.0/sprint-8-api-completion-cleanup.md`** — T1-T3 marked ✅

---

### Changed — Sprint 8: Remove Dead Retrofit Dependency (Tasks 4-5)

**Sprint 8 Tasks 4-5 remove unused Retrofit dependency from Android build.** All HTTP calls use raw OkHttp directly. Retrofit + Gson converter were dead weight (~200KB APK savings).

#### Android — `app/`

##### Build Config

- **`app/build.gradle.kts`** — Removed `com.squareup.retrofit2:retrofit:2.9.0` and `com.squareup.retrofit2:converter-gson:2.9.0`. Added explicit `com.google.code.gson:gson:2.10.1` (was transitive dependency of Retrofit).

#### Verification

- Grep for `import retrofit2` in `app/src/` — **No matches found**
- Build verification — **BUILD SUCCESSFUL** at `v2.0 (Build: 45)`

#### Documentation

- **`docs/sprints/v2.0/sprint-8-api-completion-cleanup.md`** — T4-T7 marked ✅

---

### Added — Web Test Suite (46 tests, 8 test files)

**The web admin dashboard now has a comprehensive test suite.** Per Decision Matrix: "add... feature" → Minor + Build reset. All 46 tests pass across 8 test files covering UI components, forms, pages, layouts, and API routes.

#### Test Infrastructure

- **`jest.config.ts`** — Main config for UI component tests (jsdom environment, @swc/jest transform)
- **`jest.config.api.ts`** — Separate config for API route tests (Node environment)
- **`jest.setup.ts`** — Global mocks for next/navigation, next/headers, next/link, global fetch
- **`package.json`** — Added test scripts: `test`, `test:api`, `test:all`, `test:coverage`

#### UI Component Tests (32 tests)

- **`lib/__tests__/api.test.ts`** — 9 tests: apiGet success/error, apiPost with body/headers, getJwtFromCookies
- **`app/__tests__/page.test.tsx`** — 7 tests: hero section, version badge, stats, navigation, branding
- **`app/(dashboard)/__tests__/layout.test.tsx`** — 6 tests: sidebar nav, sign out, version badge, children rendering, mobile nav
- **`app/(auth)/login/__tests__/LoginForm.test.tsx`** — 5 tests: form fields, validation errors, submit success/failure, loading state
- **`app/(auth)/signup/__tests__/SignupForm.test.tsx`** — 5 tests: form fields, validation errors, slug format, submit success/failure, loading state

#### API Route Tests (14 tests)

- **`app/api/__tests__/login-route.test.ts`** — 3 tests: 400 invalid input, proxy to backend, error forwarding
- **`app/api/__tests__/signup-route.test.ts`** — 4 tests: 400 invalid input, slug validation, proxy to backend, error forwarding
- **`app/api/__tests__/v1-proxy-route.test.ts`** — 7 tests: 401 no JWT, proxy GET/POST/PATCH/DELETE, query params, 502 backend unavailable

#### Dependencies Added

- `jest`, `ts-jest`, `@jest/globals`, `@types/jest` — Test runner
- `jest-environment-jsdom` — Browser environment for UI tests
- `@swc/core`, `@swc/jest` — Fast JSX/TypeScript transform
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — React testing utilities

### Changed — project-rules Skill Upgraded to v1.1 (Build: 001)

**The `project-rules` skill is bumped to v1.1.** Per Decision Matrix: adding a new rule ("new capability") → minor + build reset.

**File:** `.opencode/skills/project-rules/SKILL.md` — 1036 → **1324 lines**, 8 → **9 rules**, SHA256: `73A6889BB1CB5425C9E0A7E8AE53A4E30A05ECA695DDEDC593BFD40E7D4273BD` (matches opencodeGate source).

#### New Rule 9: Sprint & Task File Naming Convention (Multi-System Projects)

For multi-system projects (2+ systems — frontend, backend, mobile, db, ops, etc.), all documentation files MUST use prefix-based naming.

**Standard format:** `<prefix>-<type>-<name>.md`

**Mandatory System Prefix Table:** Every README's Project Documentation section must include a `### 🏷 System Prefixes` table mapping each system to its prefix. **Added to this README.**

**System prefix mapping for SMS Monitor (6 systems):**

| System | Prefix | Description | Folder |
|--------|--------|-------------|--------|
| Web Admin | `web` | Next.js 14 admin dashboard | `web/` |
| Backend API | `be` | NestJS REST API | `backend/` |
| Android Monitor | `an-monitor` | Android SMS monitor client | `app/` |
| Database | `db` | Prisma schema + migrations | `backend/prisma/` |
| DevOps | `ops` | Docker, CI/CD, deployment | `docker/`, `docker-compose.yml` |
| Shared | `shared` | Cross-system types & utilities | `packages/shared-types/` |

**Cross-referencing syntax for tasks:**
- `Blocks` — task must complete before referenced task
- `Blocked By` — task cannot start until referenced task completes
- `Related` — related but not dependent

**Filtering examples:**
```bash
ls docs/sprints/web/                    # all web sprints
ls docs/sprints/be/                     # all backend sprints
find docs/ -name "an-monitor-*"         # all Android docs
find docs/ -name "shared-*"             # all cross-system docs
```

#### ⚠️ Rule 9 Compliance: Existing Docs Deviation (needs user decision)

**The current `docs/` tree is non-compliant with Rule 9's prefix convention.** All 23 existing docs were created under Rules 1-8 (pre-v1.1) and use non-prefixed filenames like `sprint-1-auth-tenants.md`, `auth.md`, `known-issues.md`.

**Per Rule 9 Enforcement: "Deviation requires explicit user approval."**

**Two paths forward — your call:**

1. **Grandfather existing docs** — Keep current filenames. Apply prefixes **only to new docs** going forward. Easier, no churn, but inconsistent.
2. **Restructure to full compliance** — Rename all 23 existing docs to `<prefix>-<type>-<name>.md` and move them into subfolders by system (`docs/sprints/web/`, `docs/features/be/`, etc.). ~30 min of mechanical work, full Rule 9 compliance.

**Recommendation:** Path 1 (grandfather). The existing docs are well-organized and don't need renaming to remain useful. New work from v1.1 forward should follow the convention. **Awaiting your decision before restructuring.**

### Added — Sprint 5: Android v2.0 Client (Device Onboarding)

**Sprint 5 ships the Android device onboarding flow.** First-launch detection with skip option, QR code scanning, manual code entry, heartbeat service, and device status in Settings. Build: `v2.0 (Build: 20)`.

#### Android App (`app/src/main/java/com/smsmonitor/`)

##### Onboarding Flow (`app/claim/`)

- **`ClaimCodeScannerActivity.kt`** — QR scanner parses `<serverUrl>/v1/claim?code=<code>` format. Extracts server URL from QR payload, saves to SettingsRepository, calls claim endpoint.
- **`ManualCodeEntryActivity.kt`** — Two-field form: Server URL + 8-character claim code. Pre-fills URL from saved preferences. Validates both fields before submission.

##### Services (`app/service/`)

- **`HeartbeatService.kt`** — Foreground service that sends `POST /v1/devices/:id/heartbeat` every 60 seconds using HMAC-signed requests. Starts automatically after successful claim.

##### Activity Updates

- **`MainActivity.kt`** — First-launch detection: if `!settingsRepository.isClaimed`, redirects to `ClaimCodeScannerActivity` instead of showing dashboard.
- **`SettingsActivity.kt`** — Shows device info card (device ID, tenant ID, server URL, connection status). Added "Re-claim Device" button to reset and re-onboard.
- **`ClaimService.kt`** — Saves `backendUrl` from QR/manual entry to SettingsRepository.

##### Layout Updates

- **`activity_manual_code_entry.xml`** — Added Server URL input field above claim code input.
- **`activity_settings.xml`** — Added device info card and re-claim button.

#### E2E Tests

- **`DeviceOnboardingFlowTest.kt`** — 12 test cases: QR format validation, URL extraction, code validation, heartbeat signature, server URL validation.

#### Documentation

- **`docs/sprints/v2.0/sprint-5-android-client.md`** — Sprint 5 plan (10 tasks, ~23.5h)
- **`docs/sprints/v2.0/sprint-5-android-v2-OBSOLETE.md`** — Marked obsolete

### Added — Sprint 6: Backend Keyword Sync

**Sprint 6 ships backend keyword synchronization.** Android app now syncs keywords from backend instead of local-only. Build: `v2.0 (Build: 16)`.

#### Changes

- **`KeywordSyncService.kt`** — Added HMAC signature to keyword sync request (`X-Device-Signature`, `X-Device-Timestamp`)
- **`MainActivity.kt`** — Auto-sync keywords from backend on app launch after claim

#### Sprint Documents

- **`docs/sprints/v2.0/sprint-6-keyword-sync.md`** — Sprint 6 plan (4 tasks, ~4h)

### Added — Sprint 7: SMS Ingest (v2.0 Endpoint)

**Sprint 7 ships v2.0 SMS ingest with HMAC authentication.** Android app sends captured SMS to backend using v2.0 API endpoint. Build: `v2.0 (Build: 16)`.

#### Changes

- **`SmsHttpSender.kt`** — Already implemented: uses `/v1/sms` with HMAC when claimed, `/sms/forward` when not
- **`SmsBroadcastReceiver.kt`** — Already working: captures SMS, matches keywords, sends via v2.0 endpoint

#### Sprint Documents

- **`docs/sprints/v2.0/sprint-7-sms-ingest.md`** — Sprint 7 plan (4 tasks, ~4h)

### Changed — Sprint 5 Documentation Cleanup

**Sprint 5 documentation corrected.** `sprint-5-android-v2.md` was marked obsolete and renamed to `sprint-5-android-v2-OBSOLETE.md`. The authoritative Sprint 5 document is now `sprint-5-android-client.md` (Android v2.0 Client — Device Onboarding).

#### Changes

- **`docs/sprints/v2.0/sprint-5-android-v2.md`** → Renamed to `sprint-5-android-v2-OBSOLETE.md`
- **`docs/sprints/v2.0/sprint-5-android-client.md`** — Now the authoritative Sprint 5 document
- **`README.md`** — Updated Sprint 5 reference to point to correct file

### Added — Version Information Display (Rule 8 Compliance)

**Version display implemented per project-rules Rule 8.** Version format: `vX.Y (Build: zzz)`.

#### Changes

- **`web/version.json`** — Single source of truth for version info (`v0.5 Build: 001`)
- **`web/app/page.tsx`** — Landing page displays version from `version.json`
- **`web/app/(dashboard)/layout.tsx`** — Dashboard sidebar footer shows version

#### Version Format

```
v0.5 (Build: 001)
```

### Added — Docker Containerization

**Full Docker Compose setup for development.** Single command brings up the entire stack: Postgres, Redis, MailHog, Backend (NestJS), and Web (Next.js).

#### Docker Files

- **`docker-compose.yml`** — Updated to include backend and web services alongside existing infra (Postgres, Redis, MailHog)
- **`docker/services/be/Dockerfile`** — Multi-stage build for NestJS backend (Node 20 Alpine, pnpm, Prisma)
- **`docker/services/web/Dockerfile`** — Multi-stage build for Next.js web admin (Node 20 Alpine, pnpm)
- **`.dockerignore`** — Excludes node_modules, .next, dist, .git from build context
- **`.env.example`** — Template for environment variables

#### Quick Start

```bash
docker compose up -d
```

Services:
- Backend: http://localhost:3000
- Web: http://localhost:3001
- MailHog: http://localhost:8025
- Postgres: localhost:5432
- Redis: localhost:6379

### Changed — Android v2.0 Version Scheme

**Android app versioning updated to v2.0 format.**

- **Version name:** `2.0` (was `alpha-XX`)
- **Version code:** Starts from 0, increments per build
- **Display format:** `v2.0 (Build: 0)` on landing page (uppercase "Build" per Rule 8)
- **Build counter:** Reset to 0 in `local.properties`

This marks the start of Android v2.0 development. The app will undergo a hard break from v1.0 per ADR-005.

### Changed — Web Version Bump to v2.0

**Web version updated to v2.0 per Rule 8 Decision Matrix (Major change = Major + Build reset).**

- **`web/version.json`** — Updated from `v0.5 (Build: 001)` to `v2.0 (Build: 001)`

### Added — Android v2.0 Multi-Tenant Migration (Sprint 5)

**Sprint 5 ships the Android v2.0 multi-tenant migration.** The app now supports device claim via QR code or manual code entry, HMAC authentication, backend keyword sync, and improved security with EncryptedSharedPreferences.

#### Android App (`app/src/main/java/com/smsmonitor/`)

##### Claim Flow (`app/claim/`)

- **`ClaimCodeScannerActivity.kt`** — CameraX + ML Kit barcode scanning for claim codes. Requests camera permission, scans QR codes, validates 8-char alphanumeric format, calls `ClaimService.claimDevice()`.
- **`ManualCodeEntryActivity.kt`** — 8-character alphanumeric input with validation. Auto-upcases input, validates format, calls `ClaimService.claimDevice()`.
- **`TenantSelectionActivity.kt`** — Displays current tenant and device info. Multi-tenant switching deferred to v2.1.

##### Security & Services

- **`ClaimService.kt`** — Calls `POST /v1/claim-codes/claim`, stores device credentials in EncryptedSharedPreferences.
- **`SettingsRepository.kt`** — Migrated to EncryptedSharedPreferences with migration logic from plain SharedPreferences.
- **`HmacSigner.kt`** — HMAC-SHA256 signing for device authentication (`X-Device-Signature`, `X-Device-Timestamp`).
- **`BatteryOptimizationHelper.kt`** — Checks battery optimization status, prompts user to whitelist app.
- **`ForwardingService.kt`** — Foreground service for critical SMS forwarding with persistent notification.
- **`KeywordSyncService.kt`** — Pulls keywords from `GET /v1/keywords` and updates local Room database.
- **`SmsHttpSender.kt`** — Updated for v2.0. Uses `/v1/sms` endpoint with HMAC, falls back to legacy for unclaimed devices.

#### Configuration

- **`build.gradle.kts`** — Added `security-crypto`, `camera-*`, `barcode-scanning` dependencies. Version `2.0`.
- **`AndroidManifest.xml`** — Added `CAMERA`, `FOREGROUND_SERVICE_DATA_SYNC` permissions. Registered claim activities and service.
- **`network_security_config.xml`** — Certificate pinning for production (`api.smsmonitor.com`). Debug bypasses.

#### Documentation

- **`docs/MIGRATION.md`** — Complete v1.0 → v2.0 migration guide.
- **`docs/runbooks/04-android-v2-smoke-test.md`** — Manual smoke test runbook.

#### E2E Tests

- **`EndToEndFlowTest.kt`** — 15 test cases: claim flow, keyword sync, SMS forwarding, HMAC authentication, integration scenarios.

### Added — ui-ux-pro-max Skill Installation

**OpenCode equipped with the ui-ux-pro-max design intelligence skill.** Per the project-rules skill, this counts as a "Config/Setup" change → Build only bump per Decision Matrix.

- **`.opencode/skills/ui-ux-pro-max/`** — 67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines, 25 chart types, 13+ tech stacks; installed via `uipro init --ai opencode`
- **`.opencode/prompts/ui-ux-pro-max.md`** — Reusable agent prompt template that directs delegated agents to use the skill (`load_skills=["ui-ux-pro-max"]`)
- **`uipro-cli@2.2.3`** — Global CLI installer (Python 3.12.10 dependency met)
- **Stack coverage for this project:** `nextjs` (web), `jetpack-compose` (app), `shadcn` primitives already in `web/components/ui/`

Verification: `python .opencode/skills/ui-ux-pro-max/scripts/search.py "minimal" --domain style` returns valid design recommendations. CLI `uipro versions` reports latest as v2.5.0 (installed v2.2.3 — upgrade optional).

### Fixed — ui-ux-pro-max Skill Not Discoverable by Agents

**Agents reported the skill as "not available" despite files being present.** Root cause: the skill was installed on disk by `uipro init --ai opencode` but never registered in `.opencode/opencode.json`. The original SKILL.md frontmatter description was also too generic to trigger auto-activation. Build only bump per Decision Matrix ("fix... bug... error" → Build only).

#### Fix

- **`.opencode/opencode.json`** — Added explicit `skills.ui-ux-pro-max` block with `enabled: true`, matching the existing `project-rules` entry format. Without this, opencode does not auto-discover the skill even though the directory exists.
- **`.opencode/skills/ui-ux-pro-max/SKILL.md` frontmatter** — Replaced vague `description: UI/UX design intelligence with searchable database` with explicit trigger phrases: *"Use when user asks to design, build, create, implement, review, fix, improve, style, or restyle any UI/UX — web pages, mobile apps, landing pages, dashboards, forms, components, or design systems."* Mirrors the trigger pattern used in `project-rules` (e.g., "Use when completing tasks, adding features...").

#### Why this matters

OpenCode's skill auto-trigger logic scans the `description` frontmatter for keyword matches against the user's request. The previous description contained zero action verbs and no UI/UX trigger words — the agent reasonably concluded the skill didn't exist. The new description has 10+ trigger words and covers web/mobile/desktop surfaces explicitly.

## [0.5.0] - 2026-06-09

### Added — v2.0 SMS Ingest & Forwarder (Sprint 4)

**Sprint 4 ships the core value prop: devices send captured SMS to the backend, which matches keywords and forwards matching messages to the tenant's configured webhook.** All three workspaces build clean (`pnpm -r build` ✅, `pnpm -r typecheck` 0 errors ✅).

#### Backend — `backend/src/`

##### SMS Ingest (`sms-ingest/`)

- **`sms-ingest.service.ts`** — `ingest(deviceId, input)` method: validates payload, checks dedup `(deviceId, smsId)`, runs keyword matching, creates `SmsLog` entry if matched, enqueues BullMQ forwarding job.
- **`sms-ingest.controller.ts`** — `POST /v1/sms` endpoint with `ApiKeyAuthGuard` authentication. Devices send SMS via API key.
- **`keyword-matcher.service.ts`** — `match(smsBody)` function: iterates tenant's enabled keywords, supports all match modes (EXACT, CONTAINS, REGEX, AT_START, AT_END), first-match wins.
- **`sms-logs.controller.ts`** — `GET /v1/sms-logs` endpoint with JWT auth for web admin to list SMS logs.
- **`sms-ingest.module.ts`** — Registers controllers and services, imports `SmsForwarderModule`.

##### SMS Forwarder (`sms-forwarder/`)

- **`sms-forwarder.service.ts`** — `enqueueForward(smsLogId)` method: adds job to BullMQ queue with exponential backoff (1s, 2s, 4s, 8s, 16s), max 5 attempts.
- **`sms-forward-processor.ts`** — BullMQ worker processor: fetches SMS log + tenant + device, HTTP POST to `tenant.forwardUrl` with payload `{ timestamp, sender, message, matchedKeyword, deviceId, smsId }`. Handles 4xx (no retry), 5xx (retry), timeout (retry).
- **`sms-forwarder.module.ts`** — Registers BullMQ queue and processor.

##### API Key Auth Guard

- **`common/guards/api-key-auth.guard.ts`** — Updated to set `req.deviceId` for downstream use by SMS ingest controller.

#### Shared Types — `packages/shared-types/`

- **`SmsStatus`** — Updated from `"SUCCESS"` to `"FORWARDED"` to match Prisma schema.
- **`smsLogSchema`** — Added `forwardedAt` field.

#### Web — `web/`

- **`app/(dashboard)/sms-logs/page.tsx`** — Server component that fetches SMS logs from backend API.
- **`app/(dashboard)/sms-logs/SmsLogsClient.tsx`** — Client component with:
  - Table showing sender, message preview, matched keyword, status badge (PENDING/FORWARDED/FAILED), timestamp
  - Status filter buttons: ALL, PENDING, FORWARDED, FAILED
  - Expandable detail view: full message, SMS ID, retry count, error message, forwardedAt timestamp
- **Dashboard layout** — Added "SMS Logs" link with MessageSquare icon to sidebar navigation.

#### E2E Tests — `backend/test/`

- **`sms-ingest.e2e-spec.ts`** — 6 test cases:
  - AC-1: Ingest with keyword match → creates SmsLog entry
  - AC-2: Ingest with no keyword match → returns matched=false
  - AC-3: Deduplication → same (deviceId, smsId) returns existing entry
  - AC-4: Missing API key → 401
  - AC-5: Multiple keyword match (first wins)
  - AC-6: EXACT match mode

#### Node Test Client — `backend/test/clients/`

- **`claim-flow.ts`** — Updated to include keyword creation and SMS ingest flow (match + no-match).

#### Documentation

- **`docs/features/sms-monitoring.md`** — Updated status to ✅ implemented
- **`docs/features/backend-forwarding.md`** — Updated status to ✅ implemented
- **`docs/sprints/v2.0/sprint-4-sms-ingest-forwarder.md`** — Sprint status updated

### Dependencies

- **`@nestjs/bullmq`** and **`bullmq`** — Added for job queue (SMS forwarding retries)

### Notes

- All 3 packages build clean: `pnpm -r build` ✅; `pnpm -r typecheck` 0 errors ✅
- BullMQ requires Redis to be running for SMS forwarding to work
- Manual smoke test deferred (known Next.js cookie issue)
- Tenant's `forwardUrl` must be configured via `PATCH /v1/tenants/:id` for forwarding to work

## [0.4.0] - 2026-06-09

### Added — v2.0 Keywords (Sprint 3)

**Sprint 3 ships keyword management for v2.0.** Tenants can create, edit, and manage keyword filters that determine which SMS messages get forwarded. All three workspaces build clean (`pnpm -r build` ✅, `pnpm -r typecheck` 0 errors ✅).

#### Backend — `backend/src/`

##### Keywords (`keywords/`)

- **`keywords.service.ts`** — `create`, `list`, `findById`, `update`, `toggle`, `delete`. Validation: word 2–50 chars, unique per tenant, max 100 keywords, regex test for REGEX mode. All operations tenant-scoped via `TenantScopedPrismaService`.
- **`keywords.controller.ts`** — `POST /v1/keywords` (create), `GET /v1/keywords` (list), `GET /v1/keywords/:id` (read), `PATCH /v1/keywords/:id` (update), `PATCH /v1/keywords/:id/toggle` (enable/disable), `DELETE /v1/keywords/:id` (delete).
- **`keywords.module.ts`** — Registers controller and service, exports service for Sprint 4 keyword matching engine.

#### Web — `web/`

- **`app/(dashboard)/keywords/page.tsx`** — Server component that fetches keywords from backend API.
- **`app/(dashboard)/keywords/KeywordsClient.tsx`** — Client component with:
  - Table showing word, match mode badge (color-coded), enabled toggle, edit/delete actions
  - "Add Keyword" button that opens a modal
  - Add/Edit keyword modal with word input, match mode dropdown (EXACT, CONTAINS, REGEX, AT_START, AT_END)
  - Delete confirmation dialog
  - Enable/disable toggle switch in each row
- **Dashboard layout** — Added "Keywords" link with Tag icon to sidebar navigation.

#### E2E Tests — `backend/test/`

- **`keywords.e2e-spec.ts`** — 10 test cases:
  - AC-1: Create keyword happy path
  - AC-2: List keywords
  - AC-3: Duplicate keyword rejection (409)
  - AC-4: Word length validation (2–50 chars)
  - AC-5: Regex validation (valid/invalid)
  - AC-6: Toggle enable/disable
  - AC-7: Update keyword
  - AC-8: Delete keyword
  - AC-9: Not found (404)
  - AC-10: All match modes

#### Documentation

- **`docs/features/keyword-configuration.md`** — Updated status to ✅ implemented
- **`docs/sprints/v2.0/sprint-3-keywords.md`** — Sprint status updated

### Notes

- All 3 packages build clean: `pnpm -r build` ✅; `pnpm -r typecheck` 0 errors ✅
- Keyword matching engine deferred to Sprint 4 (when SMS ingest lands)
- Manual smoke test deferred to next session

## [0.3.0] - 2026-06-09

### Added — v2.0 Devices & Claim Codes (Sprint 2)

**Sprint 2 ships device onboarding and management for v2.0.** All three workspaces build clean (`pnpm -r build` ✅, `pnpm -r typecheck` 0 errors ✅). **Runtime verification:** 12/12 e2e tests pass against real Postgres (8 Sprint 1 + 4 Sprint 2).

#### Backend — `backend/src/`

##### Claim Codes (`claim-codes/`)

- **`claim-codes.service.ts`** — `generate`, `list`, `findByCode`, `cancel`. Code is 8 uppercase alphanumeric chars from unambiguous alphabet. TTL defaults to 15 min (configurable 5–60). Single-use: marks `usedAt` + `usedByDeviceId` on claim.
- **`claim-codes.controller.ts`** — `POST /v1/claim-codes` (generate), `GET /v1/claim-codes` (list), `GET /v1/claim-codes/:code` (read), `POST /v1/claim-codes/claim` (public claim endpoint). Claim endpoint is `@Public()` with `@Throttle` (10 req/min/IP).

##### Devices (`devices/`)

- **`devices.service.ts`** — `list`, `findById`, `claim`, `suspend`, `resume`, `revoke`, `heartbeat`. Claim creates device with bcrypt-hashed API key, returns raw key once. Heartbeat verifies API key and rejects revoked devices.
- **`devices.controller.ts`** — `GET /v1/devices` (list), `GET /v1/devices/:id` (read), `POST /v1/devices/:id/suspend`, `POST /v1/devices/:id/resume`, `DELETE /v1/devices/:id` (revoke), `POST /v1/devices/:id/heartbeat` (public, API key auth).
- **`api-key-auth.guard.ts`** — `ApiKeyAuthGuard` reads `Authorization: Bearer <apiKey>`, resolves device via bcrypt comparison, seeds `req.role='DEVICE'`. Rejects revoked devices.

##### Rate Limiting

- **`@nestjs/throttler`** — global `ThrottlerGuard` registered as `APP_GUARD`. Default: 10 req/min/IP. Auth signup/login and claim endpoint have explicit `@Throttle` decorators.

#### Web — `web/`

- **`app/(dashboard)/devices/page.tsx`** + **`DevicesClient.tsx`** — Device list table with status badges, suspend/resume/revoke actions, generate claim code modal with QR code display (via `qrcode.react`), copy-to-clipboard, countdown timer.
- **`app/(dashboard)/tenants/page.tsx`** + **`TenantsClient.tsx`** — Tenant list with create form (carryover from Sprint 1 F-SP1-T11).
- **`app/(dashboard)/users/page.tsx`** + **`UsersClient.tsx`** — User list with invite form, role change, deactivate (carryover from Sprint 1 F-SP1-T12).
- **Dashboard layout** — Sidebar navigation with links to devices, tenants, users.
- **`app/api/v1/[...path]/route.ts`** — Generic API proxy for authenticated client-side calls.

#### E2E Tests — `backend/test/`

- **`devices-claim-codes.e2e-spec.ts`** — 4 test cases:
  - AC-1: Full claim flow (code → claim → heartbeat → list → revoke)
  - AC-2: Double-use prevention (409 Conflict)
  - AC-3: Cross-tenant claim (public endpoint by design)
  - AC-4: Revoked-device heartbeat rejection (401)
- **`auth-tenants.e2e-spec.ts`** — Added AC-13: refresh-token rotation (signup → refresh → old refresh 401)

#### Node Test Client — `backend/test/clients/`

- **`claim-flow.ts`** — Standalone Node script that drives the full claim + heartbeat flow via HTTP. Useful for manual smoke testing without a browser.

#### `packages/shared-types/`

- Added `DeviceApiKeySchema`, `ListDevicesResponseSchema`, `ClaimDeviceResponseSchema`

#### Documentation

- **`docs/features/devices.md`** — Updated status to ✅ implemented
- **`docs/features/claim-codes.md`** — Updated status to ✅ implemented
- **`docs/sprints/v2.0/sprint-2-devices-claim-codes.md`** — Sprint status updated

### Notes

- All 3 packages build clean: `pnpm -r build` ✅; `pnpm -r typecheck` 0 errors ✅
- **Full e2e suite: 12/12 pass** (8 Sprint 1 + 4 Sprint 2) against real Postgres
- QR code generation uses `qrcode.react` (client-side SVG rendering)
- Rate limiting via `@nestjs/throttler` with global guard + per-endpoint decorators
- Manual smoke test (F-SP2-T15) deferred — requires real browser interaction

## [0.2.0] - 2026-06-08

### Added — v2.0 Auth & Tenants (Sprint 1)

**Sprint 1 ships the multi-tenant authentication and tenant-management layer for v2.0.** All three workspaces build clean (`pnpm -r build` ✅, `pnpm -r typecheck` 0 errors ✅). **Runtime verification (e2e + manual smoke) deferred to the next session** — see the sprint doc's DoD section for the honest status. No new user-facing Android app changes — the `app/` directory remains sealed at v1.0 `alpha-35`.

#### Prisma schema (`backend/prisma/schema.prisma`)

- **`RefreshToken`** — rotation, revocation, lookup by `tokenHash` (unique)
- **`PasswordReset`** — short-lived reset tokens, single-use
- **`User.active`** — soft-disable flag (default `true`); `login()` rejects inactive users
- **Indexes** — `@@index([tenantId, active])` on `User`, `@@index([tokenHash])` on `RefreshToken`, `@@index([tokenHash, expiresAt])` on `PasswordReset`

#### Backend — `backend/src/`

##### Common (`common/`)

- **`tenant-context/tenant-context.storage.ts`** — `AsyncLocalStorage<TenantContext>` with `runWithTenantContext(ctx, fn)`, `getTenantContext()` (throws), `tryGetTenantContext()` (returns `undefined`)
- **`tenant-context/tenant-context.middleware.ts`** — global middleware; reads `jwt` cookie or `Authorization: Bearer`, verifies the JWT, seeds `AsyncLocalStorage`; **does not** reject on missing cookie (that's the guard's job)
- **`guards/jwt-auth.guard.ts`** — `APP_GUARD`; reads `@Public()` metadata, verifies the `jwt` cookie with `JWT_SECRET`; throws `UnauthorizedException` on missing/invalid token
- **`decorators/public.decorator.ts`** + **`roles.decorator.ts`** — `SetMetadata` helpers; `@Roles('OWNER', 'ADMIN')` plus a `RolesGuard` for future use
- **`prisma/tenant-scoped-prisma.service.ts`** — `PrismaClient` extension using `$allModels.$allOperations`; `SCOPED_MODELS` set: `User`, `Device`, `Keyword`, `SmsLog`, `ClaimCode`, `RefreshToken`, `PasswordReset`. **Auto-injects `where.tenantId`** on read/update/delete and **forces `data.tenantId`** on create/createMany. Throws `TenantScopedPrismaError` if no context — fail closed
- **`common.module.ts`** — registers `PassportModule` (default strategy `jwt`), `JwtModule.registerAsync({ secret, 15m })`, the `TenantContextMiddleware` on `*`, the `JwtAuthGuard` as `APP_GUARD`, and exports `TenantScopedPrismaService` + `JwtModule`

##### Auth (`auth/`)

- **`auth.service.ts`** — `signup`, `login`, `refresh`, `logout`. `bcryptjs` cost 12. Refresh tokens: 30-day TTL, random 48 bytes (`base64url`), `tokenHash` is the base64url of the raw token (DB lookup key). Refresh rotates: marks the old token `revokedAt` and issues a new pair. No enumeration: `tenant-not-found` and `wrong-password` both surface as `Invalid credentials` to clients, but **server logs distinguish them**
- **`auth.controller.ts`** — `@Public()` routes: `POST /v1/auth/signup`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`. Sets `jwt` and `refresh_jwt` httpOnly + `SameSite=Strict` cookies on login/refresh; clears them on logout
- **`auth.module.ts`** — imports `CommonModule`, exports `AuthService` + `JwtModule`

##### Tenants (`tenants/`)

- **`tenants.service.ts`** — `findById`, `findBySlug`, `listAll` (cross-tenant — uses raw `prisma.tenant` for slug lookups), `create`, `update`, `delete`. `create()` is called from `auth.service.signup()` (no context yet) — the raw `prisma.tenant.create()` bypasses the SCOPED_MODELS filter; the create context is the **only** place in v2.0 where we do a cross-tenant read/write, and it is gated behind a not-yet-authenticated request
- **`tenants.controller.ts`** — `GET /v1/tenants/:id` returns 404 on cross-tenant lookups (no enumeration); `PATCH /v1/tenants/:id` and `DELETE /v1/tenants/:id` are `@Roles('OWNER')` and 404 on cross-tenant
- **`tenants.module.ts`** — registers controller, exports `TenantsService`

##### Users (`users/`)

- **`users.service.ts`** — `list` (tenant-scoped), `findById` (404 if cross-tenant), `invite` (bcrypt 12, default role `VIEWER`), `changeRole`, `deactivate`
- **`users.controller.ts`** — `GET /v1/users` and `GET /v1/users/:id` (OWNER/ADMIN), `POST /v1/users` invite (OWNER/ADMIN), `PATCH /v1/users/:id/role` (OWNER), `DELETE /v1/users/:id` deactivate (OWNER)
- **`users.module.ts`** — registers controller

##### Me (`me/`)

- **`me.controller.ts`** — `GET /v1/me` → `{ user, tenant, role }`. Strips `passwordHash`. Reads context from the `TenantContextMiddleware`-seeded `AsyncLocalStorage`. **This is the single source of truth for the web dashboard**

##### `app.module.ts`

- Wires `CommonModule`, `AuthModule`, `TenantsModule`, `UsersModule`, plus the Sprint 0 `HealthController` and the new `MeController`. `main.ts` already wires `cookie-parser` (added in this sprint)

#### `test/auth-tenants.e2e-spec.ts`

8 test cases (one per AC) using `supertest` + `@nestjs/testing`. Covers:
- **AC-1** signup happy path (201, sets cookies)
- **AC-2** login happy path (200)
- **AC-3** `/v1/me` with valid JWT (returns user + tenant)
- **AC-4** unauthenticated `/v1/me` → 401
- **AC-5** cross-tenant `GET /v1/tenants/<other>` → 404
- **AC-6** password is bcrypt-hashed (`$2[aby]$` prefix, not plaintext)
- **AC-9** cross-tenant `PATCH /v1/tenants/<other>` → 404
- **AC-12** **tenant isolation regression test** — `prisma.user.findMany()` outside any request rejects with "Tenant context is not set"

`test/jest-e2e.json` configures `ts-jest` against the test files.

#### `packages/shared-types/`

- New schemas: `LoginInputSchema`, `AuthTokensSchema`, `UserSchema`, `TenantSchema`, `ApiErrorSchema`, plus `CreateUserSchema` / `CreateTenantSchema` / `CreateKeywordSchema` / `UpdateKeywordSchema` / `RegisterDeviceSchema` / `CreateClaimCodeSchema` / `ClaimDeviceSchema`
- `tenantSchema` now includes `forwardUrl`, `forwardUrlEnabled`, `retentionDays` (matches Prisma model)
- PascalCase aliases (`LoginInputSchema`, `UserSchema`, …) added so web/backend can pick whichever reads better in context

#### Web — `web/`

- `app/(auth)/login/page.tsx` + `LoginForm.tsx` — `react-hook-form` + `zodResolver(LoginInputSchema)`. Posts to `/api/auth/login` (Next.js API route proxy that forwards the backend's `Set-Cookie` headers). On success → `router.push('/dashboard')`
- `app/api/auth/login/route.ts` — Next.js API route: calls backend `POST /v1/auth/login`, forwards `Set-Cookie` to the browser response, returns the body
- `app/(dashboard)/page.tsx` — server component. Reads `jwt` cookie, calls backend `GET /v1/me` via `apiGet()` (forwards the cookie), validates the response against `MeResponseSchema`, renders the dashboard summary. `export const dynamic = 'force-dynamic'` (it reads cookies; can't prerender). 401 from the backend → `redirect('/login')`
- `lib/api.ts` — typed `apiGet<T>` / `apiPost<T>` helpers; takes the JWT cookie as a `string` and injects it on the outbound request
- `package.json` — added `@hookform/resolvers`, `react-hook-form`, `zod`

#### Documentation

- **`docs/sprints/v2.0/sprint-1-auth-tenants.md`** — **new**. 17-task backlog (F-SP1-T1 through T17), 12 acceptance criteria, locked decisions, risks, "what's next for Sprint 2"
- **`docs/features/auth.md`** — **new**. Feature spec for auth: 12 acceptance criteria, the no-enumeration policy, refresh token rotation policy, cookie config, error envelope, dependency on shared-types
- **`docs/features/tenants.md`** — **new**. Feature spec for tenants: 11 acceptance criteria, the slug uniqueness + cross-tenant 404 policy, role/plan schema, dependency on shared-types, references to `auth.md` for the signup bootstrap
- **`README.md` Project Documentation section** — alphabetized index now includes the 3 new docs

### Notes

- All 3 packages build clean: `pnpm -r build` ✅; `pnpm -r typecheck` 0 errors ✅
- **Runtime verification deferred:** Docker Desktop cannot start on the dev host (WSL is in an error state), so `pnpm dev:infra` (Postgres in Docker) is blocked. An attempt to use `embedded-postgres` (portable npm-distributed Postgres) was also blocked — it needs to download a ~100MB native binary that requires admin to install. Per the user's call, we ship Sprint 1 as **build-verified** and defer e2e + smoke to next session.
- The 8 e2e test cases in `backend/test/auth-tenants.e2e-spec.ts` are written and structurally correct (tenant-isolation regression test, cross-tenant 404, bcrypt hash check, etc.) but **have not been executed**. The honest DoD is in the sprint doc.
- Next session starts with: bring up Postgres, run the e2e suite, do the manual smoke, then start Sprint 2 (devices + claim codes).

## [0.1.6] - 2026-06-08

### Added — v2.0 multi-tenant SaaS scaffolding (Sprint 0 — Foundation)

This release marks the **end of v1.0 and the start of v2.0 development**. No new user-facing features; the change is architectural and structural.

#### Monorepo (`package.json`, `pnpm-workspace.yaml`, `docker-compose.yml`, `.gitignore`)

- Monorepo layout with `backend/`, `web/`, `packages/shared-types/`, plus the existing `app/` (Android v1.0) and `test-backend/` (legacy v1.0 test server)
- `docker-compose.yml` brings up Postgres 16 + Redis 7 + MailHog locally for dev
- `package.json` declares npm workspaces; install with `pnpm install`

#### `backend/` — NestJS API skeleton

- `package.json` — NestJS 10, Prisma 5, Passport JWT, ioredis, BullMQ, helmet, swagger
- `tsconfig.json`, `nest-cli.json` — TypeScript strict mode, decorator metadata enabled
- `Dockerfile` — multi-stage build (builder + runtime), runs `prisma migrate deploy` on startup
- `.env.example` — `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGINS`, etc.
- `prisma/schema.prisma` — initial multi-tenant data model: `Tenant`, `User`, `Device`, `ClaimCode`, `Keyword`, `SmsLog` — every domain table has `tenantId`, unique constraints, indexes
- `src/main.ts` — helmet, CORS, ValidationPipe, OpenAPI (dev only), `JSON-LOGGING` on shutdown
- `src/app.module.ts` — `ConfigModule.forRoot()` + `TerminusModule` (health)
- `src/health/health.controller.ts` — `/health` (DB ping) and `/health/live`

#### `web/` — Next.js 14 admin skeleton

- `package.json` — Next 14.2, Tailwind, shadcn/ui primitives, lucide-react, Zod, react-hook-form
- `tsconfig.json`, `next.config.mjs` — App Router, `transpilePackages` for shared types
- `tailwind.config.ts`, `postcss.config.mjs` — shadcn/ui color tokens, CSS variables for dark mode
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css` — landing page with shadcn tokens
- `components/ui/Button.tsx` — shadcn-style Button (variants: default, outline, ghost, link, destructive; sizes: default, sm, lg, icon)
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `next-env.d.ts` — Next.js types

#### `packages/shared-types/`

- `package.json` — Zod 3.23 dependency
- `tsconfig.json` — strict ESM
- `src/index.ts` — Zod schemas for: `Tenant`, `User` + `UserRole`, `Device` + `DeviceStatus`, `ClaimCode`, `Keyword` + `MatchMode`, `SmsLog` + `SmsStatus`, `InboundSms`, `HealthResponse`, `ApiError` envelope, plus `Login` + `AuthTokens`

#### v1.0 backup

- The full v1.0 working state (Android app + test Express backend + docs) is sealed at `src-backup/v1.0/` with a `README.md` manifest
- Restoring v1.0 means `cp -r src-backup/v1.0/{app,test-backend}` and the matching root build files

#### Documentation

- `docs/architecture/v2.0-overview.md` — **new**. The authoritative v2.0 architecture: high-level diagram, 7 ADRs (multi-tenancy, backend stack, web stack, shared types, auth, device onboarding, hard-break migration, build-first ordering), data model summary
- `docs/sprints/v2.0/sprint-0-foundation.md` — **new**. Sprint 0 scope, DoD, locked decisions, risks
- `docs/bugs/known-issues.md` — **new**. KI-001 (ColorOS freezes app) + KI-002 (`pm clear` blocked) carried over from v1.0
- `docs/bugs/resolved.md` — **new** (empty for now)
- `docs/testing/test-plan.md` — **new**. Test pyramid, coverage targets, CI gates
- `docs/testing/qa-checklist.md` — **new**. Pre-PR, pre-merge, pre-release, per-sprint DoD
- `docs/runbooks/README.md` + `docs/runbooks/01-local-dev.md` + `docs/runbooks/02-smoke-test.md` — **new**
- `README.md` — rewritten with mandatory **Project Documentation** index per project-rules Rule 5 (every doc has a clickable link, alphabetized within each category)

### Notes

- The **project-rules skill** (`opencodeGate/.opencode/skills/project-rules/SKILL.md`) is now the active documentation + sprint + bug-tracking rule set for this project. All 6 rules (Auto-Doc, Feature/Flow Planning, Bug Documentation, Continuous Updates, Project Doc Index, Format Consistency) are in force from this version forward. Markdown is the locked format.
- The Android app `app/` is **untouched** in this release — v1.0 alpha-35 is the current shipping build.
- Per the locked decision "build backend + web first; keep app at v1.0", no app changes ship in v2.0.x until the SaaS is production-ready (Sprint 5+).


## [0.1.5] - 2026-06-08

### Fixed
- **SMS captured but never forwarded to the backend on aggressive-OEM devices** (the log was stuck on PENDING because WorkManager was being throttled by ColorOS / Oppo). The receiver now performs an **immediate HTTP send in-process** as soon as a keyword match is found, and only falls back to WorkManager if that immediate send fails. The shared HTTP logic is extracted into `SmsHttpSender` so the receiver and the worker use identical request formatting. Log uniqueness is preserved by `upsertLog()` on `smsId` — both paths update the same row.

### Changed
- **`SmsForwardWorker` constraints** — added `NetworkType.CONNECTED`, changed `ExistingWorkPolicy.REPLACE` → `KEEP` (don't lose pending work if the receiver fires while a worker is queued), set exponential backoff base to 10s. The worker is now a true retry fallback instead of the only delivery path.
- **`SmsBroadcastReceiver`** — performs `smsHttpSender.send()` on `Dispatchers.IO` after the keyword matches. If success, flips the PENDING log to SUCCESS and drops the pending row. If failure, enqueues the worker for later.

### Verified
- Built and installed `alpha-35` (versionCode 35) on CPH2159. App launched cleanly, no `AndroidRuntime:E` errors.
- Wiped the local DB (uninstall + reinstall) and cleared the backend's in-memory store, so the next test starts from a clean state.
- APK string check confirms the new immediate-send path is in the compiled DEX.

## [0.1.4] - 2026-06-08

### Changed
- **Keyword row actions are now visible buttons** — Each row in the Keywords list now shows a pencil `Edit` icon and a trash `Delete` icon next to the enable/disable switch. Long-press to delete is gone (was undiscoverable). Tap-to-edit on the row body is also gone; the Edit button is the single, explicit entry point. Same `onEdit` / `onDelete` callbacks in the adapter, just bound to the new `ImageButton`s in `item_keyword.xml`.

### Verified
- Wiped the local app database (via uninstall — `pm clear` was blocked by the device's permission guard). New install starts with a fresh DB.
- Wiped the backend's in-memory store via `DELETE /api/sms` — `cleared: 3`, `count: 0` confirmed.
- Built and installed `alpha-30` (versionCode 30) on CPH2159.

## [0.1.3] - 2026-06-08

### Fixed
- **Forwarding logs were getting a duplicate row per SMS** — the `ForwardingService` was inserting a `PENDING` log on first enqueue **and** performing a direct HTTP send itself, then the `SmsForwardWorker` would also insert a `SUCCESS` row on the same SMS. Removed the direct HTTP path from `ForwardingService` so WorkManager is the single delivery channel. As a defense-in-depth, the worker now `upsertLog()`s by `smsId` instead of always inserting — guarantees one log row per SMS even if a `PENDING` row already exists from elsewhere.

### Added
- **Edit keyword from the keyword list** — tap a row to open the same dialog pre-filled with the existing word and match mode, then save. The dialog's title and positive button adapt to "Edit Keyword" / "Save". Long-press still deletes (unchanged). Validation reuses the existing rules in `KeywordService.updateKeyword()` (2-50 chars, no duplicates).

### Verification
- Built and installed `alpha-27` (versionCode 27) on CPH2159; no AndroidRuntime errors in logcat after launch.

## [0.1.2] - 2026-06-08

### Fixed
- **Build: `gms.tasks` listener chain in `SmsForwardWorker` was broken** — `Operation.result` is a `ListenableFuture`, not a `Task`, so `addOnSuccessListener(OnSuccessListener {...})` / `addOnFailureListener(OnFailureListener {...})` never resolved. There was no `play-services-tasks` dependency, so the imports were dead code. Removed the listener calls — `enqueueUniqueWork` doesn't need them, it logs internally on invalid requests. Uncovered while validating the new Gradle 9.5.0 toolchain against a real device.
- **Build: parcelize plugin not resolving** — The short plugin ID `id("kotlin-parcelize")` no longer resolves under AGP 9.0+ built-in Kotlin. Switched to the full plugin ID `id("org.jetbrains.kotlin.plugin.parcelize")` and pinned to version `2.3.10` (the parcelize plugin does not have a published `2.3.9`; `2.3.10` is the closest and pairs cleanly with Kotlin `2.3.9`).

### Documentation
- Updated [`docs/architecture/build-toolchain.md`](docs/architecture/build-toolchain.md) — Added parcelize row to the version matrix, two new rows to Upgrade History, and a new "Kotlin ↔ Parcelize" compatibility note

### Status
- **Current Phase:** Phase 4 complete; toolchain verified end-to-end on real device (CPH2159, build `alpha-25`/versionCode 25)
- **Next:** Release prep, certificate pinning, custom notifications (see Future Backlog)

## [0.1.1] - 2026-06-08

### Changed
- **Gradle toolchain upgrade** — Bumped to current stable stack (was on Gradle 8.13)
  - Gradle wrapper: `8.13` → `9.5.0`
  - Android Gradle Plugin: `9.2.1` (kept)
  - Kotlin: `2.3.9` (kept)
  - KSP: `2.3.9` (kept)
  - Hilt: `2.59.2` (kept)
- **Cleaned deprecated `gradle.properties` flags** — Removed `android.builtInKotlin=false` and `android.newDsl=false` (AGP 9.0+ ships built-in Kotlin support; these flags triggered deprecation warnings)

### Documentation
- Added [`docs/architecture/build-toolchain.md`](docs/architecture/build-toolchain.md) — Captures the version matrix, upgrade procedure, and compatibility notes
- Updated [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) — Toolchain section + last-updated bump
- Updated [`docs/sprints/backlog.md`](docs/sprints/backlog.md) — F-SP4-T11 added; Phase 4 marked complete

### Status
- **Current Phase:** Phase 4 complete; toolchain modernized
- **Next:** Release prep, certificate pinning, custom notifications (see Future Backlog)

## [0.1.0] - 2026-06-07

### Added
- **Phase 1-3 implementation complete** — Full SMS monitoring and forwarding app
- **Test API Server page** (`TestApiActivity`) — Send test SMS to backend and view response
- **Version info display** — `v{versionName} (build {versionCode})` shown on landing page
- **Auto-incrementing build counter** — `build.counter` in `local.properties` increments on each `assembleDebug`
- **"At Start" / "At End" match modes** — New keyword matching locations
- **Auto-generated API key** — UUID generated on first launch
- **Show/Hide API key toggle** — "Show API Key" checkbox in settings
- **Default backend URL** — `http://192.168.100.10:3000` (local test server)
- **Cleartext HTTP support** — `network_security_config.xml` for local testing
- **Local test backend** — `test-backend/server.js` (Express) with `/sms/forward` endpoint
- **Mock forwarder toggle** — Debug builds use mock, release builds use real HTTP

### Changed
- Default backend URL changed from `https://example.com` to local test address
- API key input changed from `textPassword` to toggleable visibility
- SettingsActivity: Fixed save button — added Toast feedback and better state handling
- MainActivity: Added version display at bottom of landing page

### Status
- **Current Phase:** All 3 phases complete
- **Next:** Polish, testing, and release

## [0.0.1] - 2026-06-05

### Added
- Initial project setup
- Project prompt document with feature definitions
- Technology stack comparison (MAUI vs Kotlin)
- Sprint planning for Phase 1-3

---

## [Unreleased (Legacy)] - 2026-06-05

### Changed
- Renamed `PROJECT_PROMPT.md` to `PROJECT_PLAN.md`
- Updated all documentation links to use proper markdown hyperlinks
- Changed technology stack from .NET MAUI to **Native Kotlin** with Jetpack

### Added
- Cross-reference links between all feature documents
- Documentation Structure section with clickable links in PROJECT_PLAN.md
- Related Documentation section to each feature doc

### Status
- **Current Phase:** Requirements gathering
- **Next:** Confirm technology stack and begin Phase 1
