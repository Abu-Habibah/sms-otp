import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';

@Injectable()
export class ClaimCodesService {
  constructor(
    private readonly prisma: TenantScopedPrismaService,
    private readonly raw: RawPrismaService,
  ) {}

  async generate(tenantId: string, ttlMinutes = 15, createdBy?: string, workspaceId?: string) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const claimCode = await this.prisma.claimCode.create({
      data: {
        tenantId,
        workspaceId: workspaceId ?? '',
        code,
        expiresAt,
        createdBy: createdBy ?? 'system',
      },
    });
    return { code: claimCode.code, expiresAt: claimCode.expiresAt };
  }

  async findByCode(code: string) {
    const claimCode = await this.raw.claimCode.findUnique({ where: { code } });
    if (!claimCode) throw new NotFoundException('Claim code not found');
    return claimCode;
  }

  async list() {
    return this.prisma.claimCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async cancel(id: string, tenantId: string) {
    const claimCode = await this.prisma.claimCode.findUnique({ where: { id } });
    if (!claimCode || claimCode.tenantId !== tenantId) {
      throw new NotFoundException('Claim code not found');
    }
    if (claimCode.usedAt) {
      throw new ConflictException('Cannot cancel a used claim code');
    }
    return this.prisma.claimCode.update({
      where: { id },
      data: { expiresAt: new Date() },
    });
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[crypto.randomInt(chars.length)];
    }
    return code;
  }
}
