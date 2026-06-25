import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { getTenantContext, runWithWorkspaceContext } from '../common/tenant-context/tenant-context.storage';
import { DevicesService } from '../devices/devices.service';
import { ClaimCodesService } from './claim-codes.service';

const claimBodySchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{6,12}$/, 'Claim code must be 6-12 uppercase alphanumeric characters'),
  publicKey: z.string().optional().default(''),
  deviceInfo: z.object({
    manufacturer: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    osVersion: z.string().max(50).optional(),
    appVersion: z.string().max(50).optional(),
  }).optional(),
});

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

  @UsePipes(new ZodValidationPipe(claimBodySchema))
  @Public()
  @Post('/claim')
  @HttpCode(200)
  @Throttle({ default: { limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10), ttl: 60000 } })
  async claim(@Body() body: { code: string; publicKey: string; deviceInfo?: { manufacturer?: string; model?: string; osVersion?: string; appVersion?: string } }) {
    return this.devices.claim(body.code, body.publicKey, body.deviceInfo);
  }
}
