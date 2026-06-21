import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
import { DevicesService } from './devices.service';

const heartbeatBodySchema = z.object({
  deviceInfo: z.object({
    manufacturer: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    osVersion: z.string().max(50).optional(),
    appVersion: z.string().max(50).optional(),
    simSlot1Number: z.string().max(20).optional(),
    simSlot2Number: z.string().max(20).optional(),
    deviceModel: z.string().max(50).optional(),
    androidVersion: z.string().max(50).optional(),
  }).optional(),
});

@Controller('v1/devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  async list() {
    return this.devices.list();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return device;
  }

  @Roles('OWNER', 'ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string }) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.devices.update(id, body);
  }

  @Roles('OWNER', 'ADMIN')
  @Post(':id/suspend')
  async suspend(@Param('id') id: string) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.devices.suspend(id);
  }

  @Roles('OWNER', 'ADMIN')
  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.devices.resume(id);
  }

  @Roles('OWNER', 'ADMIN')
  @Delete(':id')
  async revoke(@Param('id') id: string) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.devices.revoke(id);
  }

  @Roles('OWNER', 'ADMIN')
  @Post(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.devices.reactivate(id);
  }

  @UsePipes(new ZodValidationPipe(heartbeatBodySchema))
  @Public()
  @UseGuards(ApiKeyAuthGuard)
  @Post(':id/heartbeat')
  @HttpCode(200)
  async heartbeat(
    @Param('id') id: string,
    @Body() body: { deviceInfo?: { manufacturer?: string; model?: string; osVersion?: string; appVersion?: string; simSlot1Number?: string; simSlot2Number?: string; deviceModel?: string; androidVersion?: string } },
  ) {
    return this.devices.heartbeat(id, body.deviceInfo);
  }

  @Roles('OWNER', 'ADMIN')
  @Post(':id/identify')
  async triggerIdentification(@Param('id') id: string) {
    const ctx = getTenantContext();
    const device = await this.devices.findById(id);
    if (device.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.devices.triggerIdentification(id);
  }

  @Public()
  @UseGuards(ApiKeyAuthGuard)
  @Get(':id/identify')
  async checkIdentification(@Param('id') id: string) {
    return this.devices.checkIdentification(id);
  }

  @Public()
  @UseGuards(ApiKeyAuthGuard)
  @Post(':id/identify/ack')
  @HttpCode(200)
  async acknowledgeIdentification(@Param('id') id: string) {
    return this.devices.acknowledgeIdentification(id);
  }
}
