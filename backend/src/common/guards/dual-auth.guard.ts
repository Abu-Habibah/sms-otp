import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RawPrismaService } from '../prisma/raw-prisma.service';

/**
 * Accepts either JWT auth (web admin) or device API key (Android sync).
 * JWT can come from cookie (jwt) or Authorization header.
 * Device API key comes from Authorization header.
 */
@Injectable()
export class DualAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly raw: RawPrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const authHeader = req.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    // Try JWT first (web admin)
    const cookieToken = req.cookies?.jwt;
    const jwtToken = token || cookieToken;
    if (jwtToken) {
      try {
        const payload = this.jwt.verify(jwtToken);
        req.tenantId = payload.tenantId;
        req.userId = payload.sub;
        req.role = payload.role;
        return true;
      } catch (e) {
        // JWT invalid — fall through to device API key check
      }
    }

    // Try device API key (Android sync)
    if (token) {
      const device = await this.raw.device.findUnique({ where: { apiKey: token } });
      if (device && device.status !== 'REVOKED') {
        req.deviceId = device.id;
        req.tenantId = device.tenantId;
        req.workspaceId = device.workspaceId;
        req.apiKeyAuthed = true;
        return true;
      }
    }

    return false;
  }
}
