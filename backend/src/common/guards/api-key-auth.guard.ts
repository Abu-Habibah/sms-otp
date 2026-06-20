import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RawPrismaService } from '../prisma/raw-prisma.service';
import { runWithTenantContext } from '../tenant-context/tenant-context.storage';

/**
 * Authenticates a device via the `Authorization: Bearer <apiKey>` header.
 * Used by device-facing endpoints (heartbeat, SMS ingest, etc.).
 * Seeds tenant + workspace context for tenant-scoped queries.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly raw: RawPrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      device?: unknown;
      deviceId?: string;
      workspaceId?: string;
      tenantId?: string;
      userId?: string;
      role?: string;
    }>();
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Authorization header must be "Bearer <apiKey>"');
    }

    const apiKey = parts[1];
    const device = await this.raw.device.findUnique({ where: { apiKey } });
    if (!device) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (device.status === 'REVOKED') {
      throw new UnauthorizedException('Device revoked');
    }

    // Attach device info + tenant + workspace context for downstream use
    (req as any).device = device;
    req.deviceId = device.id;
    req.workspaceId = device.workspaceId;
    req.tenantId = device.tenantId;
    req.userId = device.id;
    req.role = 'DEVICE';

    return true;
  }
}
