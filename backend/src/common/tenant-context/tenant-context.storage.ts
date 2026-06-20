import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextValue {
  tenantId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  workspaceId?: string;
}

/**
 * AsyncLocalStorage-backed request context. The tenant context is seeded
 * by the JwtAuthGuard from the verified JWT payload and read by the
 * Prisma tenant filter extension on every query.
 *
 * Reading from a request that didn't go through the guard (e.g. a cron job,
 * a background worker) returns `undefined`; the Prisma extension then
 * throws `TenantContextMissingError` to fail closed rather than leak data.
 *
 * The optional `workspaceId` field is set by workspace-level controller
 * handlers to scope queries to a specific workspace. When set, the Prisma
 * extension also injects `workspaceId` into queries for workspace-scoped
 * models (Device, Keyword, SmsLog, ClaimCode).
 */
export const tenantContextStorage = new AsyncLocalStorage<TenantContextValue>();

export function getTenantContext(): TenantContextValue {
  const ctx = tenantContextStorage.getStore();
  if (!ctx) {
    throw new TenantContextMissingError();
  }
  return ctx;
}

export function tryGetTenantContext(): TenantContextValue | undefined {
  return tenantContextStorage.getStore();
}

export function runWithTenantContext<T>(ctx: TenantContextValue, fn: () => T): T {
  return tenantContextStorage.run(ctx, fn);
}

/**
 * Run a function with a workspace context set on top of the current tenant context.
 * This is used by workspace-specific endpoints to scope queries to a workspace.
 */
export function runWithWorkspaceContext<T>(workspaceId: string, fn: () => T): T {
  const ctx = getTenantContext();
  return tenantContextStorage.run({ ...ctx, workspaceId }, fn);
}

export class TenantContextMissingError extends Error {
  constructor() {
    super(
      'Tenant context is not set. This usually means a query ran outside of an authenticated request — wrap it in runWithTenantContext() or check the call stack.',
    );
    this.name = 'TenantContextMissingError';
  }
}
