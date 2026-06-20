import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const REFRESH_TTL_DAYS = 30;
const ACCESS_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly rawPrisma: RawPrismaService,
    private readonly scopedPrisma: TenantScopedPrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(input: { name: string; email: string; password: string }): Promise<AuthTokens> {
    const email = input.email.toLowerCase();
    const domain = email.split('@')[1];
    const slug = domain.split('.')[0];

    let tenant = await this.rawPrisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      tenant = await this.rawPrisma.tenant.create({
        data: { slug, name: input.name },
      });
    }

    const existing = await this.rawPrisma.user.findFirst({
      where: { email, tenantId: tenant.id },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.rawPrisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name: input.name,
        passwordHash,
        role: UserRole.OWNER,
      },
    });

    return this.issueTokens(user.id, user.tenantId, user.role);
  }

  async login(input: { tenantSlug?: string; email: string; password: string }): Promise<AuthTokens> {
    let tenant;
    if (input.tenantSlug) {
      tenant = await this.rawPrisma.tenant.findUnique({ where: { slug: input.tenantSlug.toLowerCase() } });
    } else {
      const user = await this.rawPrisma.user.findFirst({ where: { email: input.email.toLowerCase(), active: true } });
      if (user) {
        tenant = await this.rawPrisma.tenant.findUnique({ where: { id: user.tenantId } });
      }
    }
    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.rawPrisma.user.findFirst({
      where: { email: input.email.toLowerCase(), tenantId: tenant.id, active: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.tenantId, user.role);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.scopedPrisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.scopedPrisma.user.findFirst({ where: { id: stored.userId } });
    if (!user || !user.active) {
      throw new UnauthorizedException('User not active');
    }
    await this.scopedPrisma.refreshToken.update({
      where: { id: stored.id },
      data: { lastUsedAt: new Date() },
    });
    await this.scopedPrisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user.id, user.tenantId, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.scopedPrisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(userId: string, tenantId: string, role: UserRole): Promise<AuthTokens> {
    const accessToken = this.jwt.sign({ sub: userId, tenantId, role });
    const refreshTokenRaw = randomBytes(48).toString('base64url');
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    // Use rawPrisma for refresh token creation since this is called from signup/login (no tenant context)
    await this.rawPrisma.refreshToken.create({
      data: { userId, tenantId, tokenHash, expiresAt },
    });
    return { accessToken, refreshToken: refreshTokenRaw, expiresIn: ACCESS_TTL_SECONDS };
  }
}

export function hashRefreshToken(raw: string): string {
  // Simple hash; the raw token is the secret, the hash is the DB lookup key.
  return Buffer.from(raw).toString('base64url');
}
