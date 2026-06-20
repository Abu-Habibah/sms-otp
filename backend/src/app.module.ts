import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ClaimCodesModule } from './claim-codes/claim-codes.module';
import { CommonModule } from './common/common.module';
import { DevicesModule } from './devices/devices.module';
import { HealthController } from './health/health.controller';
import { KeywordsModule } from './keywords/keywords.module';
import { MeController } from './me/me.controller';
import { SmsIngestModule } from './sms-ingest/sms-ingest.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { WorkspaceModule } from './workspaces/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10),
    }]),
    TerminusModule,
    CommonModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ClaimCodesModule,
    DevicesModule,
    KeywordsModule,
    SmsIngestModule,
    WorkspaceModule,
  ],
  controllers: [HealthController, MeController],
})
export class AppModule {}
