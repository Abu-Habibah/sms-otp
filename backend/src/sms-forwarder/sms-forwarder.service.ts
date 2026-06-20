import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';

export const SMS_FORWARD_QUEUE = 'sms-forward';

export interface ForwardJobData {
  smsLogId: string;
}

@Injectable()
export class SmsForwarderService {
  private readonly logger = new Logger(SmsForwarderService.name);

  constructor(
    @InjectQueue(SMS_FORWARD_QUEUE) private readonly queue: Queue<ForwardJobData>,
    private readonly prisma: TenantScopedPrismaService,
    private readonly raw: RawPrismaService,
  ) {}

  async enqueueForward(smsLogId: string): Promise<void> {
    await this.queue.add('forward', { smsLogId }, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000, // 1s, 2s, 4s, 8s, 16s
      },
      removeOnComplete: true,
      removeOnFail: 100, // Keep last 100 failed jobs for debugging
    });
    this.logger.debug(`Enqueued forward job for SMS log ${smsLogId}`);
  }
}
