# Prompt: Web Agent — QR Code Documentation Alignment

## Task

Verify web admin code matches updated QR documentation and fix any gaps.

## Documentation Updated

- `docs/features/claim-codes.md` — QR format now includes `workspaceId`
- `docs/features/device-onboarding.md` — QR payload updated

## What to Verify

### 1. QR Code Generation

**File:** `web/app/(dashboard)/workspaces/[id]/tabs/DevicesTab.tsx`

Verify the QR payload includes `workspaceId`:

```typescript
const qrPayload = generatedCode
  ? `${tenantPublicApiUrl ?? ''}/v1/claim?code=${generatedCode}&workspaceId=${workspaceId}`
  : null;
```

### 2. Claim Code Modal

Verify the modal generates claim codes with `workspaceId`:

```typescript
const handleGenerate = async () => {
  const body: Record<string, unknown> = { ttlMinutes: ttl };
  if (workspaceId) body.workspaceId = workspaceId;
  const res = await fetch('/api/v1/claim-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};
```

### 3. Tenant Public API URL

Verify the QR uses `tenantPublicApiUrl` with fallback:

```typescript
const qrPayload = generatedCode
  ? `${tenantPublicApiUrl ?? ''}/v1/claim?code=${generatedCode}&workspaceId=${workspaceId}`
  : null;
```

## Acceptance Criteria

- [ ] QR payload includes workspaceId
- [ ] QR uses tenantPublicApiUrl with fallback
- [ ] Claim code generation includes workspaceId
- [ ] Modal shows correct QR format
- [ ] All existing tests still pass

## Reference

- Documentation: `docs/features/claim-codes.md`
- Documentation: `docs/features/device-onboarding.md`
- Feature spec: `docs/features/workspace-scoped-claim.md`
