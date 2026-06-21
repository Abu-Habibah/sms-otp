import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';
import { Public } from '../common/decorators/public.decorator';

const prisma = new PrismaClient();

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly rawPrisma: RawPrismaService,
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
  async checkUrl(@Body() body: { workspaceId: string }): Promise<{ reachable: boolean; statusCode?: number; error?: string }> {
    const workspace = await this.rawPrisma.workspace.findUnique({
      where: { id: body.workspaceId },
      select: { forwardUrl: true, publicApiUrl: true },
    });

    if (!workspace) {
      return { reachable: false, error: 'Workspace not found' };
    }

    const urls = [workspace.forwardUrl, workspace.publicApiUrl].filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    );

    if (urls.length === 0) {
      return { reachable: false, error: 'No URLs configured for workspace' };
    }

    // Only test the first configured URL
    const targetUrl = urls[0];

    try {
      const parsed = new URL(targetUrl);

      // Block internal/loopback addresses (SSRF prevention)
      const blockedHosts = new Set([
        'localhost', '127.0.0.1', '::1', '0.0.0.0',
      ]);
      if (blockedHosts.has(parsed.hostname)) {
        return { reachable: false, error: 'Internal URLs not allowed' };
      }
      // Block private IPv4 ranges
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) {
        return { reachable: false, error: 'Internal URLs not allowed' };
      }
      // Only allow http/https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { reachable: false, error: 'Only HTTP/HTTPS URLs are allowed' };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(parsed.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
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
