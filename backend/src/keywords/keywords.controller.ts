import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { MatchMode } from '@prisma/client';
import { z } from 'zod';
import { createKeywordSchema } from '@sms-monitor/shared-types';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
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

  @Get()
  async list() {
    const ctx = getTenantContext();
    const keywords = await this.keywords.list(ctx.workspaceId);
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
