import { Controller, Get } from '@nestjs/common';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';

@Controller('v1/me')
export class MeController {
  constructor(private readonly prisma: TenantScopedPrismaService) {}

  @Get()
  async me() {
    const ctx = getTenantContext();
    const user = await this.prisma.user.findFirst({ where: { id: ctx.userId } });
    const tenant = await this.prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
    if (!user || !tenant) {
      // Should be impossible if JwtAuthMiddleware ran, but fail closed
      throw new Error('Authenticated user/tenant not found in DB');
    }
    // Strip the password hash
    const { passwordHash: _ignored, ...safeUser } = user;
    return { user: safeUser, tenant, role: ctx.role };
  }
}
