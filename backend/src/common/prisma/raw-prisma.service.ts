import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * A plain PrismaClient with no tenant scoping. Only use this in:
 *   - Tests (cleanup that has to run across tenant boundaries)
 *   - Bootstrap paths (signup) where the tenant doesn't exist yet
 *
 * Never inject this in feature controllers/services.
 */
@Injectable()
export class RawPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
