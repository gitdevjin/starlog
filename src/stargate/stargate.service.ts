import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getRandomNickname } from 'src/utils/random-name-generator';

@Injectable()
export class StargateService {
  constructor(private readonly prisma: PrismaService) {}

  async createStargate(userId: string) {
    const stargate = await this.prisma.stargate.create({
      data: {
        userId,
        starname: getRandomNickname(),
      },
    });

    return stargate;
  }
}
