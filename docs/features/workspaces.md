# Feature: Workspaces

**Feature ID:** F-WORKSPACES
**Status:** ✅ Sprint 9 — Complete
**Last Updated:** 2026-06-13

---

## Overview

### Description

A **Workspace** is a logical grouping within a Tenant that contains devices, keywords, and SMS logs. It allows a tenant to organize devices by department, project, or location, each with its own forwarding configuration.

### Problem Solved

- Tenants with many devices need to group them logically (e.g., "HR Department", "IT Ops", "Field Team")
- Different groups may need different forwarding URLs (HR → Workday, IT → PagerDuty)
- Users should only see/manage devices in their assigned workspaces

### User Story

> As a tenant admin, I want to create workspaces to organize devices by department, each with its own forwarding URL, so that HR devices forward to Workday and IT devices forward to PagerDuty.

---

## Scope

### In Scope

- Workspace CRUD (create, read, update, delete)
- Workspace-scoped devices, keywords, SMS logs
- Workspace-level `forwardUrl` (overrides tenant default)
- User-Workspace membership with roles (OWNER, ADMIN, MEMBER, VIEWER)
- Device claim into specific workspace
- User access control per workspace

### Out of Scope (Future)

- Workspace billing/limits
- Workspace transfer between tenants
- Nested workspaces
- Workspace-level API keys (separate from device keys)

---

## Data Model

```prisma
model Workspace {
  id            String   @id @default(uuid())
  tenantId      String
  name          String
  slug          String   // unique per tenant
  forwardUrl    String?  // overrides tenant.forwardUrl
  retentionDays Int      @default(90)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant        Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  devices       Device[]
  keywords      Keyword[]
  smsLogs       SmsLog[]
  userWorkspaces UserWorkspace[]

  @@unique([tenantId, slug])
  @@map("workspaces")
}

model UserWorkspace {
  userId      String
  workspaceId String
  role        WorkspaceRole @default(MEMBER)
  createdAt   DateTime    @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@id([userId, workspaceId])
  @@map("user_workspaces")
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

---

## API Endpoints

### Workspaces

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/v1/workspaces` | JWT | TENANT_OWNER, TENANT_ADMIN | Create workspace |
| GET | `/v1/workspaces` | JWT | Any | List user's workspaces |
| GET | `/v1/workspaces/:id` | JWT | Member+ | Get workspace |
| PATCH | `/v1/workspaces/:id` | JWT | WORKSPACE_OWNER, WORKSPACE_ADMIN | Update workspace |
| DELETE | `/v1/workspaces/:id` | JWT | WORKSPACE_OWNER | Delete workspace |
| GET | `/v1/workspaces/:id/devices` | JWT | Member+ | List workspace devices |
| GET | `/v1/workspaces/:id/keywords` | JWT | Member+ | List workspace keywords |
| GET | `/v1/workspaces/:id/sms-logs` | JWT | Member+ | List workspace SMS logs |

### Workspace Members

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/v1/workspaces/:id/members` | JWT | WORKSPACE_ADMIN+ | List members |
| POST | `/v1/workspaces/:id/members` | JWT | WORKSPACE_ADMIN+ | Add member |
| PATCH | `/v1/workspaces/:id/members/:userId` | JWT | WORKSPACE_OWNER | Change role |
| DELETE | `/v1/workspaces/:id/members/:userId` | JWT | WORKSPACE_OWNER | Remove member |

### Device Claim (Updated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/claim-codes` | JWT | Generate claim code for workspace |
| POST | `/v1/claim-codes/claim` | Public | Claim device with code + workspaceId |

### Forwarding URL Resolution

```
device.forwardUrl ?? workspace.forwardUrl ?? tenant.forwardUrl
```

### URL Validation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/health/check-url` | Public | Check if URL is reachable (5s timeout) |

---

## Workspace Settings

The workspace settings page includes:

| Field | Description | Validation |
|-------|-------------|------------|
| **Workspace Name** | Display name for the workspace | Min 2 chars, max 100 |
| **Public API URL** | External URL for device claim QR codes | URL format + Test button |
| **Forward URL (Webhook)** | Webhook URL where matched SMS are sent | URL format + Test button |
| **Retention (days)** | How long to keep SMS logs | 1-365 days |

---

## UI Changes

### Web Admin

| Page | Changes |
|------|---------|
| `/workspaces` | New page: list, create, edit, delete workspaces |
| `/workspaces/:id` | Workspace detail: devices, keywords, members, settings tabs |
| `/workspaces/:id/settings` | Public API URL, Forward URL (Webhook), retention settings with Test buttons |

### Android App

| Screen | Changes |
|--------|---------|
| Claim flow | Select workspace (if user has multiple) |
| Settings | Show workspace name |
| Dashboard | Filter by workspace (if user has multiple) |

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | Tenant OWNER/ADMIN can create workspace |
| AC-2 | Workspace slug unique per tenant |
| AC-3 | Workspace forwardUrl overrides tenant forwardUrl |
| AC-4 | User assigned to workspace can see its devices/keywords |
| AC-5 | User without workspace access cannot see it (404) |
| AC-6 | Device claimed into workspace uses workspace config |
| AC-7 | Workspace OWNER can manage members |
| AC-8 | Deleting workspace cascades (devices, keywords, logs) |
| AC-9 | Tenant OWNER can manage ALL workspaces |

---

## Migration Plan

| Phase | Tasks |
|-------|-------|
| 1. DB | Create `workspaces`, `user_workspaces` tables |
| 2. Default | Create default workspace per tenant ("Default") |
| 3. Migrate | Move existing devices/keywords/logs to default workspace |
| 4. Relations | Add UserWorkspace entries for existing users (TENANT_OWNER → WORKSPACE_OWNER) |
| 5. Schema | Drop tenantId from Device/Keyword, add workspaceId |
| 6. API | Add workspace endpoints |
| 7. UI | Add workspace management |

---

## Cross-References

- Sprint doc: `docs/sprints/v2.0/sprint-X-workspaces.md`
- Related: `docs/features/tenants.md`, `docs/features/devices.md`, `docs/features/claim-codes.md`
