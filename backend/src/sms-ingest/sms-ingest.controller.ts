import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';
import { runWithTenantContext } from '../common/tenant-context/tenant-context.storage';
import { SmsIngestService, IngestSmsInput } from './sms-ingest.service';

@Controller('v1/sms')
export class SmsIngestController {
  constructor(private readonly smsIngest: SmsIngestService) {}

  @Public()
  @UseGuards(ApiKeyAuthGuard)
  @Post()
  @HttpCode(201)
  async ingest(
    @Req() req: Request,
    @Body() body: IngestSmsInput,
  ) {
    const deviceId = (req as Request & { deviceId?: string }).deviceId;
    if (!deviceId) {
      throw new Error('Device ID not found in request');
    }
    const tenantId = (req as Request & { tenantId?: string }).tenantId!;
    const workspaceId = (req as Request & { workspaceId?: string }).workspaceId!;
    return runWithTenantContext(
      { tenantId, userId: deviceId, role: 'VIEWER', workspaceId },
      () => this.smsIngest.ingest(deviceId, body),
    );
  }

  @Get()
  async list() {
    return this.smsIngest.list();
  }
}
