import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PlanetService } from './planet.service';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import { UserEntity } from 'src/types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePlanetDto } from './dto/create-planet.dto';
import { UpdatePlanetDto } from './dto/update-planet.dto';

@Controller('planet')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only images allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    })
  )
  postCreatePlanet(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreatePlanetDto,
    @UploadedFiles() images: Express.Multer.File[]
  ) {
    return this.planetService.createPlanet({ userId: user.id, content: dto.content, images });
  }

  @Get(':planetId')
  async getPlanetById(
    @Param('planetId', ParseIntPipe) planetId: number,
    @CurrentUser() user: UserEntity
  ) {
    return this.planetService.getPlanetById({ planetId, userId: user.id });
  }

  @Get()
  getPlanets(
    @Query('scope') scope: 'universe' | 'orbit' | 'star',
    @Query('from', ParseIntPipe) from: number,
    @Query('to', ParseIntPipe) to: number,
    @Query('creatorId') creatorId: string,
    @CurrentUser() user: UserEntity
  ) {
    switch (scope) {
      case 'universe':
        return this.planetService.getUniverse({ from, to, userId: user.id });

      case 'orbit':
      // return this.planetService.getOrbit({
      //   userId: req.user.id,
      //   from,
      //   to,
      // });

      case 'star':
        if (!creatorId) {
          throw new BadRequestException('creatorId is required for star scope');
        }
        return this.planetService.getPlanetsByCreator({
          creatorId,
          viewerId: user.id,
          from,
          to,
        });

      default:
        throw new BadRequestException('Invalid scope');
    }
  }

  @Patch(':planetId')
  patchUpdatePlanet(
    @Param('planetId', ParseIntPipe) planetId: number,
    @Body() dto: UpdatePlanetDto,
    @CurrentUser() user: UserEntity
  ) {
    return this.planetService.updatePlanet({ planetId, content: dto.content, userId: user.id });
  }

  @Delete(':planetId')
  deletePlanet(@Param('planetId', ParseIntPipe) planetId: number, @CurrentUser() user: UserEntity) {
    return this.planetService.deletePlanet({ planetId, userId: user.id });
  }

  @Post(':planetId/gravity')
  async toggleGravity(
    @Param('planetId', ParseIntPipe) planetId: number,
    @CurrentUser() user: UserEntity
  ) {
    return this.planetService.togglePlanetGravity({ planetId, userId: user.id });
  }
}
