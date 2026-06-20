import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  list() {
    return this.users.list();
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  async findOne(@Param('id') id: string) {
    const ctx = getTenantContext();
    const user = await this.users.findById(id);
    if (user.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return user;
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  async invite(@Body() body: { email: string; name: string; role?: UserRole; tempPassword: string }) {
    return this.users.invite(body);
  }

  @Patch(':id/role')
  @Roles('OWNER')
  changeRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.users.changeRole(id, body.role);
  }

  @Delete(':id')
  @Roles('OWNER')
  async deactivate(@Param('id') id: string) {
    const ctx = getTenantContext();
    const user = await this.users.findById(id);
    if (user.tenantId !== ctx.tenantId) {
      throw new NotFoundException('Not found');
    }
    return this.users.deactivate(id);
  }
}
