import { Body, Controller, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  createProfile(@Body('id') id: string) {
    return this.profileService.createProfile(id);
  }
}
