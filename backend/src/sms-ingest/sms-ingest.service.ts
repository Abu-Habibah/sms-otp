import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { SmsStatus } from '@prisma/client';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';
import { KeywordMatcherService } from './keyword-matcher.service';
import { SmsForwarderService } from '../sms-forwarder/sms-forwarder.service';

export interface IngestSmsInput {
  sender: string;
  message: string;
  smsId: string;
  timestamp: string;
}

export interface IngestSmsResult {
  smsId: string;
  matched: boolean;
  matchedKeyword: string | null;
  status: SmsStatus;
}

@Injectable()
export class SmsIngestService {
  private readonly logger = new Logger(SmsIngestService.name);

  constructor(
    private readonly prisma: TenantScopedPrismaService,
    private readonly keywordMatcher: KeywordMatcherService,
    private readonly forwarder: SmsForwarderService,
  ) {}

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.smsLog.findMany({
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.smsLog.count(),
    ]);
    return { logs, total, page, limit };
  }

  async ingest(deviceId: string, input: IngestSmsInput): Promise<IngestSmsResult> {
    const ctx = getTenantContext();

    // Dedup check: (deviceId, smsId) unique
    const existing = await this.prisma.smsLog.findFirst({
      where: { deviceId, smsId: input.smsId },
    });
    if (existing) {
      this.logger.debug(`Duplicate SMS ${input.smsId} from device ${deviceId}, skipping`);
      return {
        smsId: input.smsId,
        matched: true,
        matchedKeyword: existing.matchedKeyword,
        status: existing.status,
      };
    }

    // Match keywords
    const matchResult = await this.keywordMatcher.match(input.message);

    if (!matchResult.matched) {
      this.logger.debug(`No keyword match for SMS ${input.smsId}, discarding`);
      return {
        smsId: input.smsId,
        matched: false,
        matchedKeyword: null,
        status: 'PENDING', // Not actually stored
      };
    }

    // Fetch device to get workspaceId
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      this.logger.warn(`Device ${deviceId} not found for SMS ingest, dropping`);
      return {
        smsId: input.smsId,
        matched: false,
        matchedKeyword: null,
        status: 'PENDING',
      };
    }

    // Create SmsLog entry
    const smsLog = await this.prisma.smsLog.create({
      data: {
        tenantId: '', // Overridden by TenantScopedPrismaService
        workspaceId: device.workspaceId,
        deviceId,
        smsId: input.smsId,
        sender: input.sender,
        message: input.message,
        matchedKeyword: matchResult.keyword!,
        status: 'PENDING',
        receivedAt: new Date(input.timestamp),
      },
    });

    // Enqueue forwarding job
    await this.forwarder.enqueueForward(smsLog.id);

    this.logger.log(`SMS ${input.smsId} ingested, matched "${matchResult.keyword}", queued for forwarding`);

    return {
      smsId: input.smsId,
      matched: true,
      matchedKeyword: matchResult.keyword,
      status: 'PENDING',
    };
  }
}
