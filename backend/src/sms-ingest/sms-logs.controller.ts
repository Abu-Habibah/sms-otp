import { Controller, Get } from '@nestjs/common';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';

@Controller('v1/sms-logs')
export class SmsLogsController {
  constructor(private readonly prisma: TenantScopedPrismaService) {}

  @Get()
  async list() {
    return this.prisma.smsLog.findMany({
      orderBy: { receivedAt: 'desc' },
    });
  }
}
