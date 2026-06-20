import { Logger } from '@nestjs/common';
import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';
import { SMS_FORWARD_QUEUE, ForwardJobData } from './sms-forwarder.service';

@Processor(SMS_FORWARD_QUEUE)
export class SmsForwardProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsForwardProcessor.name);

  constructor(private readonly raw: RawPrismaService) {
    super();
  }

  async process(job: Job<ForwardJobData>): Promise<void> {
    const { smsLogId } = job.data;
    this.logger.log(`Processing forward job for SMS log ${smsLogId} (attempt ${job.attemptsMade + 1})`);

    // Fetch the SMS log with tenant, workspace, and device info
    const smsLog = await this.raw.smsLog.findUnique({
      where: { id: smsLogId },
      include: { tenant: true, device: true, workspace: true },
    });

    if (!smsLog) {
      this.logger.warn(`SMS log ${smsLogId} not found, skipping`);
      return;
    }

    // Resolve forwarding URL: workspace.forwardUrl ?? tenant.forwardUrl
    const forwardUrl = smsLog.workspace?.forwardUrl ?? smsLog.tenant.forwardUrl;
    const forwardEnabled = smsLog.workspace?.forwardUrlEnabled ?? smsLog.tenant.forwardUrlEnabled;

    if (!forwardUrl || !forwardEnabled) {
      this.logger.warn(`No forward URL configured for workspace/tenant ${smsLog.tenantId}, marking as FAILED`);
      await this.raw.smsLog.update({
        where: { id: smsLogId },
        data: { status: 'FAILED', errorMessage: 'No forward URL configured' },
      });
      return;
    }

    // Build the forwarding payload
    const payload = {
      timestamp: smsLog.receivedAt.toISOString(),
      sender: smsLog.sender,
      message: smsLog.message,
      matchedKeyword: smsLog.matchedKeyword,
      deviceId: smsLog.deviceId,
      smsId: smsLog.smsId,
    };

    try {
      const response = await fetch(forwardUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${smsLog.device.apiKey}`,
          'X-Device-ID': smsLog.deviceId,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (response.ok) {
        this.logger.log(`SMS ${smsLogId} forwarded successfully to ${forwardUrl}`);
        await this.raw.smsLog.update({
          where: { id: smsLogId },
          data: { status: 'FORWARDED', forwardedAt: new Date() },
        });
      } else if (response.status >= 400 && response.status < 500) {
        // Client error — don't retry
        const errorText = await response.text().catch(() => 'Unknown error');
        this.logger.error(`SMS ${smsLogId} forward failed with ${response.status}: ${errorText}`);
        await this.raw.smsLog.update({
          where: { id: smsLogId },
          data: { status: 'FAILED', errorMessage: `HTTP ${response.status}: ${errorText}` },
        });
      } else {
        // Server error — retry
        const errorText = await response.text().catch(() => 'Unknown error');
        this.logger.warn(`SMS ${smsLogId} forward failed with ${response.status}, will retry: ${errorText}`);
        await this.raw.smsLog.update({
          where: { id: smsLogId },
          data: { retryCount: { increment: 1 }, errorMessage: `HTTP ${response.status}: ${errorText}` },
        });
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      // Network error or timeout — retry
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`SMS ${smsLogId} forward failed with network error, will retry: ${errorMessage}`);
      await this.raw.smsLog.update({
        where: { id: smsLogId },
        data: { retryCount: { increment: 1 }, errorMessage },
      });
      throw error; // Re-throw to trigger BullMQ retry
    }
  }
}
