import { Module } from '@nestjs/common';
import { MoonService } from './moon.service';
import { MoonController } from './moon.controller';

@Module({
  controllers: [MoonController],
  providers: [MoonService],
})
export class MoonModule {}
