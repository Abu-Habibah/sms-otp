import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tryGetTenantContext, type TenantContextValue } from '../tenant-context/tenant-context.storage';

/**
 * PrismaClient extension that auto-injects `where: { tenantId }` on every
 * read and write touching a tenant-scoped model.
 *
 * Models in the SCOPED_MODELS set are wrapped: their `findMany`, `findFirst`,
 * `findUnique`, `count`, `aggregate`, `groupBy`, `update`, `updateMany`,
 * `delete`, `deleteMany`, `create`, and `findFirstOrThrow` calls get
 * `where.tenantId = ctx.tenantId` merged in if not already present.
 *
 * The `create` path is special: it forces the `tenantId` to the active
 * context, defending against a client trying to create an entity in
 * a different tenant than they're authenticated for.
 *
 * Models not in SCOPED_MODELS (e.g. `Tenant` itself — you read across
 * tenants to find yours by slug) are left untouched.
 */
const SCOPED_MODELS = new Set([
  'User',
  'Device',
  'Keyword',
  'SmsLog',
  'ClaimCode',
  'RefreshToken',
  'Workspace',
  'UserWorkspace',
]);

/**
 * Models that have a workspaceId column and should be filtered by
 * workspace context when it's set.
 */
const WORKSPACE_SCOPED_MODELS = new Set([
  'Device',
  'Keyword',
  'SmsLog',
  'ClaimCode',
]);

@Injectable()
export class TenantScopedPrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(TenantScopedPrismaService.name);

  constructor() {
    super();
    const ext = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: { model: string; operation: string; args: unknown; query: (a: unknown) => Promise<unknown> }) {
            if (!model || !SCOPED_MODELS.has(model as string)) {
              return query(args);
            }
            const ctx = tryGetTenantContext();
            if (!ctx) {
              throw new Error(
                `TenantScopedPrismaService: tried to read/write ${model}.${operation} without a tenant context. ` +
                  `Wrap in runWithTenantContext() or check that JwtAuthMiddleware ran.`,
              );
            }
            const a = args as Record<string, unknown> & { where?: Record<string, unknown>; data?: Record<string, unknown> };

            // Inject tenantId into data for create/createMany (these don't support where)
            if (a.data && (operation === 'create' || operation === 'createMany')) {
              const dataArr = Array.isArray(a.data) ? a.data : [a.data];
              for (const d of dataArr) {
                const data = d as Record<string, unknown>;
                data.tenantId = ctx.tenantId;
                // Also inject workspaceId if set in context and model is workspace-scoped
                if (ctx.workspaceId && WORKSPACE_SCOPED_MODELS.has(model as string)) {
                  data.workspaceId = ctx.workspaceId;
                }
              }
              return query(a);
            }

            // For all other operations, inject tenantId into the where clause
            if (a.where) {
              a.where = { ...a.where, tenantId: ctx.tenantId };
            } else {
              a.where = { tenantId: ctx.tenantId };
            }

            // Also inject workspaceId if set in context and model is workspace-scoped
            if (ctx.workspaceId && WORKSPACE_SCOPED_MODELS.has(model as string)) {
              a.where = { ...a.where, workspaceId: ctx.workspaceId };
            }

            return query(a);
          },
        },
      },
    });
    Object.assign(this, ext);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to Postgres (tenant-scoped)');
  }
}
