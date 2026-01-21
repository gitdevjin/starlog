import { Body, Controller, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { StargateService } from './stargate.service';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import { UserEntity } from 'src/types';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('stargate')
export class StargateController {
  constructor(private readonly stargateService: StargateService) {}

  @Post()
  createStargate(@Body('id') id: string) {
    return this.stargateService.createStargate(id);
  }

  @UseInterceptors(FileInterceptor('image'))
  @Patch('image/avatar')
  updateStargateAvatar(
    @CurrentUser() user: UserEntity,
    @UploadedFile() image: Express.Multer.File
  ) {
    return this.stargateService.updateStargateAvatarImage(user.id, image);
  }

  @UseInterceptors(FileInterceptor('image'))
  @Patch('image/cover')
  updateStargateCover(@CurrentUser() user: UserEntity, @UploadedFile() image: Express.Multer.File) {
    console.log('called');
    return this.stargateService.updateStargateCoverImage(user.id, image);
  }
}
