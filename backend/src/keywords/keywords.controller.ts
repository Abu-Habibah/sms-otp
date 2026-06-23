import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import type { Request } from 'express';
import { MatchMode } from '@prisma/client';
import { z } from 'zod';
import { createKeywordSchema } from '@sms-monitor/shared-types';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';
import { runWithTenantContext } from '../common/tenant-context/tenant-context.storage';
import { KeywordsService } from './keywords.service';

const createKeywordBodySchema = createKeywordSchema.extend({
  workspaceId: z.string().uuid().optional(),
});

@Controller('v1/keywords')
export class KeywordsController {
  constructor(private readonly keywords: KeywordsService) {}

  @UsePipes(new ZodValidationPipe(createKeywordBodySchema))
  @Post()
  @HttpCode(201)
  async create(@Body() body: { word: string; matchMode?: MatchMode; enabled?: boolean; workspaceId?: string }) {
    return this.keywords.create(body);
  }

  @Public()
  @UseGuards(ApiKeyAuthGuard)
  @Get()
  async list(@Req() req: Request, @Query('workspaceId') workspaceId?: string) {
    const reqWorkspaceId = (req as Request & { workspaceId?: string }).workspaceId;
    const reqTenantId = (req as Request & { tenantId?: string }).tenantId;
    const effectiveWsId = workspaceId || reqWorkspaceId;

    if (reqTenantId) {
      return runWithTenantContext(
        { tenantId: reqTenantId, userId: (req as any).deviceId ?? '', role: 'VIEWER', workspaceId: effectiveWsId },
        () => this.keywords.list(effectiveWsId).then(k => ({ keywords: k })),
      );
    }

    const keywords = await this.keywords.list(effectiveWsId);
    return { keywords };
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
