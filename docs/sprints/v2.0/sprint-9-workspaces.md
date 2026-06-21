# Sprint 9 — Workspaces

**Sprint window:** 2026-06-14 → 2026-06-20
**Status:** ✅ Complete (2026-06-18)
**Owner:** jokos
**Goal:** Introduce Workspaces as a logical grouping within Tenants for organizing devices, keywords, and SMS logs with per-workspace forwarding configuration. Device claim is workspace-scoped.

---

## Scope (in)

| # | Deliverable | Layer |
|---|---|---|
| 1 | Workspace model + migration | backend (DB) |
| 2 | Workspace CRUD API | backend |
| 3 | User-Workspace membership API | backend |
| 4 | Workspace-scoped device/keyword/log queries | backend |
| 4 | Forwarding URL resolution (device/workspace/tenant) | backend |
| 5 | Device claim into workspace | backend + android |
| 6 | Web workspace management UI | web |
| 7 | Android workspace selection on claim | android |

## Scope (out)

- Workspace billing/limits
- Workspace transfer between tenants
- Nested workspaces
- Workspace-level API keys
- Real-time workspace updates

---

## Definition of Done

- [x] Prisma migration runs cleanly
- [x] `pnpm --filter @sms-monitor/backend typecheck` — 0 errors
- [x] `pnpm --filter @sms-monitor/backend build` — clean
- [x] `pnpm --filter @sms-monitor/backend test:e2e` — all tests pass
- [x] Android builds without errors
- [x] Web builds without errors
- [x] Manual smoke: create workspace → claim device → verify forwarding
- [x] `CHANGELOG.md` has `[0.8.0]` entry

---

## Sprint Backlog

| ID | Task | Description | Est. | Priority | Status |
|---|---|---|---|---|---|
| F-SP9-T1 | Prisma schema | Add Workspace, UserWorkspace models | 2h | P0 | ✅ |
| F-SP9-T2 | Migration | Create tables + default workspace per tenant | 1h | P0 | ✅ |
| F-SP9-T3 | Data migration | Move existing devices/keywords/logs to default workspace | 1h | P0 | ✅ |
| F-SP9-T4 | UserWorkspace seed | Add existing users as WORKSPACE_OWNER of default | 0.5h | P0 | ✅ |
| F-SP9-T5 | WorkspaceService | CRUD + member management | 3h | P0 | ✅ |
| F-SP9-T6 | WorkspaceController | REST endpoints | 2h | P0 | ✅ |
| F-SP9-T7 | Device/Keyword/Log queries | Scope to workspace | 2h | P0 | ✅ |
| F-SP9-T8 | Forwarding URL resolution | device/workspace/tenant fallback | 1h | P0 | ✅ |
| F-SP9-T9 | Claim code update | Accept workspaceId in claim | 1h | P0 | ✅ |
| F-SP9-T10 | Claim-codes API | POST /v1/claim-codes accepts workspaceId | 0.5h | P0 | ✅ |
| F-SP9-T11 | Web workspace list | List, create, edit, delete | 3h | P0 | ✅ |
| F-SP9-T12 | Web workspace detail | Devices, keywords, members tabs | 3h | P0 | ✅ |
| F-SP9-T13 | Web members management | Add/remove/role change | 2h | P0 | ✅ |
| F-SP9-T14 | Android claim | Select workspace on claim | 2h | P0 | ✅ |
| F-SP9-T15 | Android settings | Show workspace name | 0.5h | P1 | ✅ |
| F-SP9-T16 | E2E tests | Workspace CRUD, membership, claim, forwarding | 3h | P0 | ✅ |
| F-SP9-T17 | Docs | Update features, sprint doc, CHANGELOG | 1h | P1 | ✅ |
| F-SP9-T18 | Backend: Claim response | Return workspaceId, workspaceName in claim response | 0.5h | P0 | ✅ |
| F-SP9-T19 | Backend: ApiKeyAuthGuard | Seed workspaceId from device record | 0.3h | P0 | ✅ |
| F-SP9-T20 | Backend: Keyword sync | Filter by workspaceId when device context present | 0.5h | P0 | ✅ |
| F-SP9-T21 | Android: QR payload | Extract workspaceId from QR query param | 0.5h | P0 | ✅ |
| F-SP9-T22 | Android: Claim request | Send workspaceId in claim request body | 0.3h | P0 | ✅ |
| F-SP9-T23 | Android: KeywordSyncService | Add workspaceId query param to request | 0.3h | P0 | ✅ |
| F-SP9-T27 | Android: Post-claim sync | Sync keywords immediately after successful claim (both QR and manual) | 0.5h | P0 | ✅ |
| F-SP9-T24 | Web: Workspace DevicesTab | Add "Add Device" button with claim modal | 1h | P0 | ✅ |
| F-SP9-T25 | Web: QR payload | Include workspaceId in QR URL | 0.3h | P0 | ✅ |
| F-SP9-T26 | Web: Devices page | Remove or simplify claim modal | 0.5h | P1 | ✅ |

**Sprint 9 total: ~32h** of focused work.

---

## Migration Details

### Phase 1: Schema + Tables

```sql
-- New tables
CREATE TABLE workspaces (...);
CREATE TABLE user_workspaces (...);

-- Add workspaceId to existing tables
ALTER TABLE devices ADD COLUMN workspace_id UUID;
ALTER TABLE keywords ADD COLUMN workspace_id UUID;
ALTER TABLE sms_logs ADD COLUMN workspace_id UUID;
```

### Phase 2: Default Workspace

```sql
-- Create "Default" workspace per tenant
INSERT INTO workspaces (id, tenant_id, name, slug, ...)
SELECT gen_random_uuid(), id, 'Default', 'default', ... FROM tenants;
```

### Phase 3: Migrate Data

```sql
-- Move devices to default workspace
UPDATE devices SET workspace_id = (
  SELECT id FROM workspaces WHERE tenant_id = devices.tenant_id AND slug = 'default'
);

-- Same for keywords, sms_logs
```

### Phase 4: UserWorkspace Seed

```sql
-- TENANT_OWNER → WORKSPACE_OWNER for default workspace
INSERT INTO user_workspaces (user_id, workspace_id, role)
SELECT u.id, w.id, 'OWNER'
FROM users u
JOIN workspaces w ON w.tenant_id = u.tenant_id AND w.slug = 'default'
WHERE u.role = 'OWNER';
```

### Phase 5: Drop Old Columns

```sql
ALTER TABLE devices DROP COLUMN tenant_id;
ALTER TABLE keywords DROP COLUMN tenant_id;
-- sms_logs keeps both for query flexibility
```

---

## Forwarding URL Resolution Logic

```typescript
function getForwardUrl(device: Device): string {
  return device.workspace.forwardUrl 
    ?? device.workspace.tenant.forwardUrl 
    ?? DEFAULT_FORWARD_URL;
}
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Data migration fails | Medium | Test on staging; backup before prod |
| Breaking existing API contracts | Low | Version API or use query param |
| UserWorkspace role confusion | Low | Clear docs; UI defaults to MEMBER |
| Workspace deletion with active devices | Medium | Soft-delete or require empty workspace |

---

## Cross-References

- Feature spec: `docs/features/workspaces.md`
- Feature spec: `docs/features/workspace-scoped-claim.md`
- Related: `docs/features/tenants.md`, `docs/features/devices.md`, `docs/features/claim-codes.md`

---

## Status

_Starting after Sprint 8 completion._

> **Status updated by Sisyphus audit on 2026-06-21 — all tasks verified complete in codebase.**
