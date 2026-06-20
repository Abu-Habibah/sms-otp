import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole, type UserRole } from '@prisma/client';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';
import {
  getTenantContext,
  runWithWorkspaceContext,
} from '../common/tenant-context/tenant-context.storage';

export interface CreateWorkspaceInput {
  name: string;
  forwardUrl?: string;
  forwardUrlEnabled?: boolean;
  retentionDays?: number;
  publicApiUrl?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  forwardUrl?: string;
  forwardUrlEnabled?: boolean;
  retentionDays?: number;
  publicApiUrl?: string;
}

export interface AddMemberInput {
  userId: string;
  role?: WorkspaceRole;
}

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: TenantScopedPrismaService,
    private readonly raw: RawPrismaService,
  ) {}

  private isTenantAdmin(role: UserRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  private async assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
    ctxRole: UserRole,
    requiredRoles: WorkspaceRole[],
  ): Promise<void> {
    // Tenant OWNER/ADMIN bypasses workspace membership checks
    if (this.isTenantAdmin(ctxRole)) return;

    // UserWorkspace has no tenantId — use raw prisma for all userWorkspace ops
    const membership = await this.raw.userWorkspace.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Workspace not found');

    if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }
  }

  async create(input: CreateWorkspaceInput) {
    const ctx = getTenantContext();
    if (!this.isTenantAdmin(ctx.role)) {
      throw new ForbiddenException('Only tenant owners and admins can create workspaces');
    }

    const existing = await this.prisma.workspace.findFirst({
      where: { name: input.name },
    });
    if (existing) throw new ConflictException('A workspace with this name already exists');

    const workspace = await this.prisma.workspace.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        forwardUrl: input.forwardUrl,
        forwardUrlEnabled: input.forwardUrlEnabled ?? true,
        retentionDays: input.retentionDays ?? 90,
        publicApiUrl: input.publicApiUrl,
      },
    });

    // Auto-add creator as WORKSPACE_OWNER (use raw prisma — UserWorkspace has no tenantId)
    await this.raw.userWorkspace.create({
      data: {
        userId: ctx.userId,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    return workspace;
  }

  async list() {
    const ctx = getTenantContext();

    // Tenant OWNER/ADMIN sees all workspaces in the tenant
    if (this.isTenantAdmin(ctx.role)) {
      return this.prisma.workspace.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    // Other users see only their assigned workspaces
    const memberships = await this.raw.userWorkspace.findMany({
      where: { userId: ctx.userId },
      include: { workspace: true },
    });
    return memberships.map((m) => m.workspace);
  }

  async findById(id: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(id, ctx.userId, ctx.role, []);

    return this.prisma.workspace.findUnique({ where: { id } });
  }

  async update(id: string, input: UpdateWorkspaceInput) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(id, ctx.userId, ctx.role, ['OWNER', 'ADMIN']);

    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (input.name !== undefined) {
      const existing = await this.prisma.workspace.findFirst({
        where: { name: input.name, id: { not: id } },
      });
      if (existing) throw new ConflictException('A workspace with this name already exists');
    }

    return this.prisma.workspace.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.forwardUrl !== undefined ? { forwardUrl: input.forwardUrl } : {}),
        ...(input.forwardUrlEnabled !== undefined ? { forwardUrlEnabled: input.forwardUrlEnabled } : {}),
        ...(input.retentionDays !== undefined ? { retentionDays: input.retentionDays } : {}),
        ...(input.publicApiUrl !== undefined ? { publicApiUrl: input.publicApiUrl } : {}),
      },
    });
  }

  async remove(id: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(id, ctx.userId, ctx.role, ['OWNER']);

    await this.prisma.workspace.delete({ where: { id } });
  }

  // ─── Members ─────────────────────────────────────────────────────

  async listMembers(workspaceId: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, ['OWNER', 'ADMIN']);

    return this.raw.userWorkspace.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  async addMember(workspaceId: string, input: AddMemberInput) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, ['OWNER', 'ADMIN']);

    // Verify workspace exists
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Check user exists in same tenant
    const user = await this.raw.user.findUnique({ where: { id: input.userId } });
    if (!user || user.tenantId !== ctx.tenantId) {
      throw new NotFoundException('User not found');
    }

    // Check not already a member
    const existing = await this.raw.userWorkspace.findUnique({
      where: { userId_workspaceId: { userId: input.userId, workspaceId } },
    });
    if (existing) throw new ConflictException('User is already a member of this workspace');

    return this.raw.userWorkspace.create({
      data: {
        userId: input.userId,
        workspaceId,
        role: input.role ?? 'MEMBER',
      },
    });
  }

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, ['OWNER']);

    const membership = await this.raw.userWorkspace.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    return this.raw.userWorkspace.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, ['OWNER']);

    const membership = await this.raw.userWorkspace.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (membership.role === 'OWNER') {
      const ownerCount = await this.raw.userWorkspace.count({
        where: { workspaceId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new ConflictException('Cannot remove the last workspace owner');
      }
    }

    await this.raw.userWorkspace.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  }

  // ─── Workspace-Scoped Query Helpers ─────────────────────────────────

  async findWorkspaceDevices(workspaceId: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, []);

    // Use runWithWorkspaceContext to auto-scope queries
    return runWithWorkspaceContext(workspaceId, () =>
      this.prisma.device.findMany({ orderBy: { createdAt: 'desc' } }),
    );
  }

  async findWorkspaceKeywords(workspaceId: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, []);

    return runWithWorkspaceContext(workspaceId, () =>
      this.prisma.keyword.findMany({ orderBy: { createdAt: 'desc' } }),
    );
  }

  async findWorkspaceSmsLogs(workspaceId: string) {
    const ctx = getTenantContext();
    await this.assertWorkspaceAccess(workspaceId, ctx.userId, ctx.role, []);

    return runWithWorkspaceContext(workspaceId, () =>
      this.prisma.smsLog.findMany({ orderBy: { receivedAt: 'desc' } }),
    );
  }
}
