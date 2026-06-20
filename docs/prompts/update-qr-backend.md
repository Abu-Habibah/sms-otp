# Prompt: Backend Agent — QR Code Documentation Alignment

## Task

Verify backend code matches updated QR documentation and fix any gaps.

## Documentation Updated

- `docs/features/claim-codes.md` — QR format now includes `workspaceId`
- `docs/features/device-onboarding.md` — QR payload updated

## What to Verify

### 1. Claim Endpoint

**File:** `backend/src/devices/devices.service.ts`

Verify the claim endpoint accepts and processes `workspaceId` from the QR code:

```typescript
// The claim endpoint should:
// 1. Accept code from QR
// 2. Look up claim code
// 3. Get workspaceId from claim code
// 4. Create device with workspaceId
```

### 2. Claim Response

Verify the claim response includes `workspaceId` and `workspaceName`:

```typescript
return {
  device: {
    id: device.id,
    name: device.name,
    status: device.status,
    createdAt: device.createdAt.toISOString(),
    workspaceId: device.workspaceId,
    workspaceName: workspace?.name ?? null,
  },
  apiKey: device.apiKey,
  serverUrl: process.env['PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000',
};
```

### 3. Claim Code Generation

**File:** `backend/src/claim-codes/claim-codes.service.ts`

Verify claim codes are created with `workspaceId`:

```typescript
async generate(tenantId: string, ttlMinutes = 15, createdBy?: string, workspaceId?: string) {
  // ...
  const claimCode = await this.prisma.claimCode.create({
    data: {
      tenantId,
      workspaceId: workspaceId ?? '', // Should be provided
      code,
      expiresAt,
      createdBy: createdBy ?? 'system',
    },
  });
}
```

## Acceptance Criteria

- [ ] Claim endpoint accepts workspaceId
- [ ] Claim response includes workspaceId, workspaceName
- [ ] Claim codes are created with workspaceId
- [ ] Device is created with workspaceId from claim code
- [ ] All existing tests still pass

## Reference

- Documentation: `docs/features/claim-codes.md`
- Documentation: `docs/features/device-onboarding.md`
- Feature spec: `docs/features/workspace-scoped-claim.md`
