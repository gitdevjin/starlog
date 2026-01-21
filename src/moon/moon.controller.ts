import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { MoonService } from './moon.service';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import { UserEntity } from 'src/types';
import { CreateMoonDto } from './dto/create-moon.dto';
import { UpdateMoonDto } from './dto/update-moon.dto';

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

  @Patch('/moon/:moonId')
  patchUpdateMoon(
    @Param('moonId', ParseIntPipe) moonId: number,
    @Body() dto: UpdateMoonDto,
    @CurrentUser() user: UserEntity
  ) {
    return this.moonService.updateMoon({
      moonId,
      content: dto.content,
      creatorId: user.id,
    });
  }
}
