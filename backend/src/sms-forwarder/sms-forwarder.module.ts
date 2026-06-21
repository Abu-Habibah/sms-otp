import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SmsForwarderService, SMS_FORWARD_QUEUE } from './sms-forwarder.service';
import { SmsForwardProcessor } from './sms-forward-processor';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({
      name: SMS_FORWARD_QUEUE,
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6004',
      },
    }),
  ],
  providers: [SmsForwarderService, SmsForwardProcessor],
  exports: [SmsForwarderService],
})
export class SmsForwarderModule {}
