import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: TenantScopedPrismaService) {}

  async list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async invite(input: { email: string; name: string; role?: UserRole; tempPassword: string }) {
    const ctx = getTenantContext();
    const email = input.email.toLowerCase();
    const existing = await this.prisma.user.findFirst({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(input.tempPassword, 12);
    return this.prisma.user.create({
      data: {
        tenantId: ctx.tenantId,
        email,
        name: input.name,
        passwordHash,
        role: input.role ?? UserRole.VIEWER,
      },
    });
  }

  async changeRole(id: string, role: UserRole) {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({ where: { id }, data: { active: false } });
  }
}
