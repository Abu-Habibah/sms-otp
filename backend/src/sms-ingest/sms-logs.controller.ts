import { Controller, Get, Query } from '@nestjs/common';
import { SmsIngestService } from './sms-ingest.service';

@Controller('v1/sms-logs')
export class SmsLogsController {
  constructor(private readonly smsIngest: SmsIngestService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.smsIngest.list(pageNum, limitNum);
  }
}
