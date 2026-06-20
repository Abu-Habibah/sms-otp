import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from '../health/health.controller';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantContextMiddleware } from './tenant-context/tenant-context.middleware';
import { TenantScopedPrismaService } from './prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from './prisma/raw-prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env['JWT_SECRET'] ?? 'change-me',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    TerminusModule,
  ],
  providers: [
    TenantScopedPrismaService,
    RawPrismaService,
    TenantContextMiddleware,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [TenantScopedPrismaService, RawPrismaService, JwtModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}

export { Public, Roles };
