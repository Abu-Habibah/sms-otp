import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload } from '../tenant-context/tenant-context.middleware';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Default auth guard. Public routes opt out via `@Public()`.
 * The JwtAuthMiddleware has already seeded the tenant context; we just
 * verify that a valid JWT is present (non-public routes only).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{ cookies?: Record<string, string>; headers?: Record<string, string> }>();
    const cookieToken = req.cookies?.jwt;
    const authHeader = req.headers?.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const token = cookieToken ?? bearerToken;
    if (!token) {
      throw new UnauthorizedException('No auth cookie');
    }
    try {
      this.jwt.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}
