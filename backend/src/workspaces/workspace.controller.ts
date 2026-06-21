import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { createWorkspaceSchema } from '@sms-monitor/shared-types';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { WorkspaceService, type CreateWorkspaceInput, type UpdateWorkspaceInput } from './workspace.service';

@Controller('v1/workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // ─── Workspace CRUD ────────────────────────────────────────────────

  @UsePipes(new ZodValidationPipe(createWorkspaceSchema))
  @Post()
  create(@Body() input: CreateWorkspaceInput) {
    return this.workspaceService.create(input);
  }

  @Get()
  list() {
    return this.workspaceService.list();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.workspaceService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateWorkspaceInput) {
    return this.workspaceService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceService.remove(id);
  }

  // ─── Members ───────────────────────────────────────────────────────

  @Get(':id/members')
  listMembers(@Param('id') id: string) {
    return this.workspaceService.listMembers(id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() input: { userId: string; role?: WorkspaceRole },
  ) {
    return this.workspaceService.addMember(id, input);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() input: { role: WorkspaceRole },
  ) {
    return this.workspaceService.updateMemberRole(id, userId, input.role);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.workspaceService.removeMember(id, userId);
  }

  // ─── Workspace-Scoped Resources ────────────────────────────────────

  @Get(':id/devices')
  findDevices(@Param('id') id: string) {
    return this.workspaceService.findWorkspaceDevices(id);
  }

  @Get(':id/keywords')
  findKeywords(@Param('id') id: string) {
    return this.workspaceService.findWorkspaceKeywords(id);
  }

  @Get(':id/sms-logs')
  findSmsLogs(@Param('id') id: string) {
    return this.workspaceService.findWorkspaceSmsLogs(id);
  }
}
