import { Body, Controller, Post } from '@nestjs/common';
import { StargateService } from './stargate.service';

@Controller('stargate')
export class StargateController {
  constructor(private readonly stargateService: StargateService) {}

  @Post()
  createStargate(@Body('id') id: string) {
    return this.stargateService.createStargate(id);
  }
}
