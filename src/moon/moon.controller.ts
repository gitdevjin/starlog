import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { MoonService } from './moon.service';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import { UserEntity } from 'src/types';
import { CreateMoonDto } from './dto/create-moon.dto';

@Controller()
export class MoonController {
  constructor(private readonly moonService: MoonService) {}

  @Get('/planet/:planetId/moon')
  getMoonByPlanet(@Param('planetId', ParseIntPipe) planetId: number) {
    return this.moonService.getMoonsByPlanet(planetId);
  }

  @Post('/planet/:planetId/moon')
  postCreateMoon(
    @Param('planetId', ParseIntPipe) planetId: number,
    @Body() dto: CreateMoonDto,
    @CurrentUser() user: UserEntity
  ) {
    return this.moonService.createMoon({
      planetId,
      content: dto.content,
      parentMoonId: dto.parentMoonId,
      creatorId: user.id,
    });
  }
}
