import { Module } from '@nestjs/common';
import { SmsIngestController } from './sms-ingest.controller';
import { SmsLogsController } from './sms-logs.controller';
import { SmsIngestService } from './sms-ingest.service';
import { KeywordMatcherService } from './keyword-matcher.service';
import { SmsForwarderModule } from '../sms-forwarder/sms-forwarder.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, SmsForwarderModule],
  controllers: [SmsIngestController, SmsLogsController],
  providers: [SmsIngestService, KeywordMatcherService],
  exports: [SmsIngestService, KeywordMatcherService],
})
export class SmsIngestModule {}
