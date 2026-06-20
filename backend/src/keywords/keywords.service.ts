import { ConflictException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchMode } from '@prisma/client';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { getTenantContext } from '../common/tenant-context/tenant-context.storage';

const MAX_KEYWORDS_PER_TENANT = 100;

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: TenantScopedPrismaService) {}

  async create(data: { word: string; matchMode?: MatchMode; enabled?: boolean; workspaceId?: string }) {
    const ctx = getTenantContext();

    // Validate word length
    if (data.word.length < 2 || data.word.length > 50) {
      throw new BadRequestException('Word must be between 2 and 50 characters');
    }

    // Validate regex if matchMode is REGEX
    if (data.matchMode === 'REGEX') {
      try {
        new RegExp(data.word);
      } catch {
        throw new BadRequestException('Invalid regular expression');
      }
    }

    // Check max keywords limit
    const count = await this.prisma.keyword.count();
    if (count >= MAX_KEYWORDS_PER_TENANT) {
      throw new ConflictException(`Maximum of ${MAX_KEYWORDS_PER_TENANT} keywords reached`);
    }

    // Check for duplicate word
    const existing = await this.prisma.keyword.findFirst({
      where: { word: data.word },
    });
    if (existing) {
      throw new ConflictException('Keyword already exists');
    }

    const workspaceId = data.workspaceId || ctx.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.prisma.keyword.create({
      data: {
        tenantId: ctx.tenantId,
        workspaceId,
        word: data.word,
        matchMode: data.matchMode ?? 'CONTAINS',
        enabled: data.enabled ?? true,
      },
    });
  }

  async list(workspaceId?: string) {
    const where = workspaceId ? { workspaceId } : {};
    return this.prisma.keyword.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const keyword = await this.prisma.keyword.findUnique({ where: { id } });
    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }
    return keyword;
  }

  async update(id: string, data: { word?: string; matchMode?: MatchMode; enabled?: boolean }) {
    // Verify keyword exists
    await this.findById(id);

    // Validate word length if provided
    if (data.word !== undefined && (data.word.length < 2 || data.word.length > 50)) {
      throw new BadRequestException('Word must be between 2 and 50 characters');
    }

    // Validate regex if matchMode is REGEX or word is being changed
    const wordToCheck = data.word ?? (await this.findById(id)).word;
    const modeToCheck = data.matchMode ?? (await this.findById(id)).matchMode;
    if (modeToCheck === 'REGEX' && data.word !== undefined) {
      try {
        new RegExp(data.word);
      } catch {
        throw new BadRequestException('Invalid regular expression');
      }
    }

    // Check for duplicate word if word is being changed
    if (data.word !== undefined) {
      const existing = await this.prisma.keyword.findFirst({
        where: { word: data.word, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Keyword already exists');
      }
    }

    return this.prisma.keyword.update({
      where: { id },
      data,
    });
  }

  async toggle(id: string) {
    const keyword = await this.findById(id);
    return this.prisma.keyword.update({
      where: { id },
      data: { enabled: !keyword.enabled },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.keyword.delete({ where: { id } });
  }
}
