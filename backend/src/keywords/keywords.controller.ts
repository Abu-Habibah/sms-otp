import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UnauthorizedException, UsePipes } from '@nestjs/common';
import type { Request } from 'express';
import { MatchMode } from '@prisma/client';
import { z } from 'zod';
import { createKeywordSchema } from '@sms-monitor/shared-types';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';
import { runWithTenantContext } from '../common/tenant-context/tenant-context.storage';
import { KeywordsService } from './keywords.service';

const createKeywordBodySchema = createKeywordSchema.extend({
  workspaceId: z.string().uuid().optional(),
});

@Controller('v1/keywords')
export class KeywordsController {
  constructor(
    private readonly keywords: KeywordsService,
    private readonly jwt: JwtService,
    private readonly raw: RawPrismaService,
  ) {}

  @UsePipes(new ZodValidationPipe(createKeywordBodySchema))
  @Post()
  @HttpCode(201)
  async create(@Body() body: { word: string; matchMode?: MatchMode; enabled?: boolean; workspaceId?: string }) {
    return this.keywords.create(body);
  }

  @Public()
  @Get()
  async list(@Req() req: Request) {
    const r = req as any;
    const auth = r.headers?.authorization ?? '';
    const bearer = auth.startsWith('Bearer ') ? auth.substring(7) : undefined;

    // Try JWT (from cookie or Authorization header)
    const cookieToken = r.cookies?.jwt;
    const jwtToken = bearer || cookieToken;
    if (jwtToken) {
      try {
        const payload = this.jwt.verify(jwtToken);
        const ctx = { tenantId: payload.tenantId, userId: payload.sub, role: payload.role as any };
        return runWithTenantContext(ctx, () => this.keywords.list().then(k => ({ keywords: k })));
      } catch {}
    }

    // Try device API key
    if (bearer) {
      const device = await this.raw.device.findUnique({ where: { apiKey: bearer } });
      if (device && device.status !== 'REVOKED') {
        return runWithTenantContext(
          { tenantId: device.tenantId, userId: device.id, role: 'VIEWER', workspaceId: device.workspaceId },
          () => this.keywords.list(device.workspaceId).then(k => ({ keywords: k })),
        );
      }
    }

    throw new UnauthorizedException();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.keywords.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { word?: string; matchMode?: MatchMode; enabled?: boolean }) {
    return this.keywords.update(id, body);
  }

  @Patch(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.keywords.toggle(id);
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    return this.keywords.delete(id);
  }
}
