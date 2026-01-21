import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getRandomNickname } from 'src/utils/random-name-generator';
import * as path from 'path';
import { S3Service } from 'src/aws/s3.service';
import { UserPublicSelect } from 'src/prisma/prisma.select';

@Injectable()
export class StargateService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService
  ) {}

  async createStargate(userId: string) {
    const stargate = await this.prisma.stargate.create({
      data: {
        userId,
        starname: getRandomNickname(),
      },
    });

    return stargate;
  }

  async updateStargateAvatarImage(userId, image) {
    const s3Key = `${userId}/stargate/${randomUUID()}${path.extname(image.originalname)}`;

    const stargate = await this.prisma.stargate.findUnique({
      where: { userId },
    });

    if (!stargate) {
      throw new BadRequestException('Stargate not found');
    }

    let newImageUrl: string | null = null;
    try {
      newImageUrl = await this.s3Service.updateAvatarImage(s3Key, image);

      const updatedStargate = await this.prisma.stargate.update({
        where: { id: stargate.id },
        data: {
          avatarUrl: newImageUrl,
        },
      });

      if (stargate.avatarUrl) {
        const oldKey = this.s3Service.extractKeyFromUrl(stargate.avatarUrl);
        if (oldKey) {
          await this.s3Service.deleteImagesByKey([oldKey]);
        }
      }

      console.log(`Stargate Avatar Updated: ${updatedStargate.starname}`);

      return this.prisma.user.findUnique({
        where: { id: userId },
        select: UserPublicSelect,
      });
    } catch (err: any) {
      if (newImageUrl) {
        await this.s3Service.deleteImagesByKey([s3Key]);
      }
      throw new BadRequestException('Update Stargate Avatar Image Failed');
    }
  }

  async updateStargateCoverImage(userId, image) {
    const s3Key = `${userId}/stargate/${randomUUID()}${path.extname(image.originalname)}`;

    const stargate = await this.prisma.stargate.findUnique({
      where: { userId },
    });

    if (!stargate) {
      throw new BadRequestException('Stargate not found');
    }

    let newImageUrl: string | null = null;
    try {
      newImageUrl = await this.s3Service.updateAvatarImage(s3Key, image);

      const updatedStargate = await this.prisma.stargate.update({
        where: { id: stargate.id },
        data: {
          coverUrl: newImageUrl,
        },
      });

      if (stargate.coverUrl) {
        const oldKey = this.s3Service.extractKeyFromUrl(stargate.coverUrl);
        if (oldKey) {
          await this.s3Service.deleteImagesByKey([oldKey]);
        }
      }

      console.log(`Stargate Cover Updated: ${updatedStargate.starname}`);

      return this.prisma.user.findUnique({
        where: { id: userId },
        select: UserPublicSelect,
      });
    } catch (err: any) {
      if (newImageUrl) {
        await this.s3Service.deleteImagesByKey([s3Key]);
      }
      throw new BadRequestException('Update Stargate Cover Image Failed');
    }
  }
}
