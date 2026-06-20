import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { MatchMode } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
import { KeywordsService } from './keywords.service';

@Controller('v1/keywords')
export class KeywordsController {
  constructor(private readonly keywords: KeywordsService) {}

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
