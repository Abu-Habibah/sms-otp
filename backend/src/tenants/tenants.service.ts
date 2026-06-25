import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';

export interface CreateTenantInput {
  name: string;
  slug: string;
  forwardUrl?: string;
  retentionDays?: number;
  publicApiUrl?: string;
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: TenantScopedPrismaService) {}

  async create(input: CreateTenantInput) {
    const slug = input.slug.toLowerCase();
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('slug is taken');
    }
    return this.prisma.tenant.create({
      data: {
        name: input.name,
        slug,
        forwardUrl: input.forwardUrl,
        retentionDays: input.retentionDays ?? 90,
        publicApiUrl: input.publicApiUrl,
      },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async list() {
    const ctx = getTenantContext();
    return this.prisma.tenant.findMany({
      where: { id: ctx.tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, input: Partial<CreateTenantInput>) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.forwardUrl !== undefined ? { forwardUrl: input.forwardUrl } : {}),
        ...(input.retentionDays !== undefined ? { retentionDays: input.retentionDays } : {}),
        ...(input.publicApiUrl !== undefined ? { publicApiUrl: input.publicApiUrl } : {}),
      },
    });
  }

  async remove(id: string): Promise<void> {
    // Cascades via Prisma `onDelete: Cascade` on all child relations
    await this.prisma.tenant.delete({ where: { id } });
  }
}
