import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

const prisma = new PrismaClient();

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', prisma),
    ]);
  }

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Post('check-url')
  async checkUrl(@Body() body: { url: string; type: string }): Promise<{ reachable: boolean; statusCode?: number; error?: string }> {
    try {
      const url = new URL(body.url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      return {
        reachable: response.ok || response.status < 500,
        statusCode: response.status,
      };
    } catch (err) {
      return {
        reachable: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      };
    }
  }
}
