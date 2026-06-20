import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DevicesModule } from '../devices/devices.module';
import { ClaimCodesController } from './claim-codes.controller';
import { ClaimCodesService } from './claim-codes.service';

@Module({
  imports: [CommonModule, DevicesModule],
  controllers: [ClaimCodesController],
  providers: [ClaimCodesService],
  exports: [ClaimCodesService],
})
export class ClaimCodesModule {}
