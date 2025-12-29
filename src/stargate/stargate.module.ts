import { Module } from '@nestjs/common';
import { StargateService } from './stargate.service';
import { StargateController } from './stargate.controller';

@Module({
  controllers: [StargateController],
  providers: [StargateService],
  exports: [StargateService],
})
export class StargateModule {}
