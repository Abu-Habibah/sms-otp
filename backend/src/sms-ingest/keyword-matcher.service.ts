import { Injectable, Logger } from '@nestjs/common';
import { MatchMode } from '@prisma/client';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';

export interface KeywordMatchResult {
  matched: boolean;
  keyword: string | null;
}

@Injectable()
export class KeywordMatcherService {
  private readonly logger = new Logger(KeywordMatcherService.name);

  constructor(private readonly prisma: TenantScopedPrismaService) {}

  async match(smsBody: string): Promise<KeywordMatchResult> {
    const keywords = await this.prisma.keyword.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const kw of keywords) {
      if (this.matchOne(smsBody, kw.word, kw.matchMode)) {
        this.logger.debug(`SMS matched keyword "${kw.word}" (${kw.matchMode})`);
        return { matched: true, keyword: kw.word };
      }
    }

    return { matched: false, keyword: null };
  }

  private matchOne(body: string, word: string, mode: MatchMode): boolean {
    switch (mode) {
      case 'EXACT':
        return body === word;
      case 'CONTAINS':
        return body.toLowerCase().includes(word.toLowerCase());
      case 'REGEX':
        try {
          return new RegExp(word).test(body);
        } catch {
          this.logger.warn(`Invalid regex pattern: ${word}`);
          return false;
        }
      case 'AT_START':
        return body.startsWith(word);
      case 'AT_END':
        return body.endsWith(word);
      default:
        return false;
    }
  }
}
