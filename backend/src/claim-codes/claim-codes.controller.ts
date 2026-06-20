import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { getTenantContext, runWithWorkspaceContext } from '../common/tenant-context/tenant-context.storage';
import { DevicesService } from '../devices/devices.service';
import { ClaimCodesService } from './claim-codes.service';

@Controller('v1/claim-codes')
export class ClaimCodesController {
  constructor(
    private readonly claimCodes: ClaimCodesService,
    private readonly devices: DevicesService,
  ) {}

  @Post()
  @HttpCode(201)
  async generate(@Body() body: { ttlMinutes?: number; workspaceId?: string }) {
    const ctx = getTenantContext();
    if (body.workspaceId) {
      return runWithWorkspaceContext(body.workspaceId, () =>
        this.claimCodes.generate(ctx.tenantId, body.ttlMinutes, ctx.userId, body.workspaceId),
      );
    }
    return this.claimCodes.generate(ctx.tenantId, body.ttlMinutes, ctx.userId);
  }

  @Get()
  async list() {
    return this.claimCodes.list();
  }

  @Get(':code')
  async findOne(@Param('code') code: string) {
    return this.claimCodes.findByCode(code);
  }

  @Roles('OWNER', 'ADMIN')
  @Delete(':id')
  @HttpCode(204)
  async cancel(@Param('id') id: string) {
    const ctx = getTenantContext();
    await this.claimCodes.cancel(id, ctx.tenantId);
  }

  @Public()
  @Post('/claim')
  @HttpCode(200)
  @Throttle({ default: { limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10), ttl: 60000 } })
  async claim(@Body() body: { code: string; publicKey: string; deviceInfo?: { manufacturer?: string; model?: string; osVersion?: string; appVersion?: string } }) {
    return this.devices.claim(body.code, body.publicKey, body.deviceInfo);
  }
}
