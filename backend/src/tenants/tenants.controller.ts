import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
import { CreateTenantInput, TenantsService } from './tenants.service';

@Controller('v1/tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('me')
  async me() {
    const ctx = getTenantContext();
    return this.tenants.findById(ctx.tenantId);
  }

  @Get()
  list() {
    return this.tenants.list();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ctx = getTenantContext();
    if (id !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.tenants.findById(id);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  async create(@Body() body: CreateTenantInput) {
    return this.tenants.create(body);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  async update(@Param('id') id: string, @Body() body: Partial<CreateTenantInput>) {
    const ctx = getTenantContext();
    if (id !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.tenants.update(id, body);
  }

  @Delete(':id')
  @Roles('OWNER')
  async remove(@Param('id') id: string) {
    const ctx = getTenantContext();
    if (id !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    await this.tenants.remove(id);
  }
}
