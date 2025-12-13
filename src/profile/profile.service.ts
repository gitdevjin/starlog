import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getRandomNickname } from 'src/utils/random-name-generator';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string) {
    const profile = await this.prisma.profile.create({
      data: {
        userId,
        nickname: getRandomNickname(),
      },
    });

    return profile;
  }
}
