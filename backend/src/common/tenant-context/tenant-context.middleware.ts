import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { runWithTenantContext, TenantContextMissingError } from './tenant-context.storage';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Reads the `jwt` cookie, verifies it, and seeds the tenant context for the
 * rest of the request. This middleware is registered globally so every
 * controller has a tenant context available.
 *
 * Note: it does NOT throw on missing cookies — the JwtAuthGuard is
 * responsible for that. This middleware just opportunistically seeds
 * the context if a valid cookie is present, so even "optional auth"
 * endpoints get tenant context.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const token = this.extractToken(req);
    if (!token) {
      next();
      return;
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      // Invalid or expired — let downstream guards decide whether to reject
      next();
      return;
    }

    req.user = payload;
    runWithTenantContext(
      { tenantId: payload.tenantId, userId: payload.sub, role: payload.role },
      () => next(),
    );
  }

  private extractToken(req: Request): string | undefined {
    const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.jwt;
    if (cookieToken) return cookieToken;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.substring('Bearer '.length);
    return undefined;
  }
}

export { UnauthorizedException, TenantContextMissingError };
