import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { S3Service } from 'src/aws/s3.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlanetEntity } from 'src/types';

@Injectable()
export class PlanetService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService
  ) {}

  async getPlanetById({ planetId, userId }: { planetId: number; userId: string }) {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
      include: {
        moons: {
          include: {
            childMoons: true, // include nested moons if needed
          },
        },
        gravities: {
          where: { creatorId: userId }, // only check if current user liked
          select: { id: true }, // we only need existence
        },
        creator: {
          include: { stargate: true },
        },
      },
    });

    if (!planet) {
      throw new NotFoundException(`Planet with id ${planetId} not found`);
    }

    const isGravityOn = planet.gravities.length > 0;

    // Remove gravities array from response not to expose it
    delete planet.gravities;

    return { ...planet, isGravityOn };
  }

  async getUniverse({ from, to, userId }: { from: number; to: number; userId: string }) {
    const planets = await this.prisma.planet.findMany({
      orderBy: { createdAt: 'desc' },
      skip: from,
      take: to - from + 1,
      include: {
        creator: {
          include: { stargate: true },
        },
        gravities: {
          where: { creatorId: userId },
        },
      },
    });

    return planets.map((planet) => ({
      ...planet,
      isGravityOn: planet.gravities.length > 0,
      gravities: undefined, // or omit via DTO
    }));
  }

  async createPlanet({
    userId,
    content,
    images,
  }: {
    userId: string;
    content: string;
    images: Express.Multer.File[];
  }) {
    const s3Keys = images.map(
      (file) => `planets/${userId}/${randomUUID()}${path.extname(file.originalname)}`
    );

    try {
      const imageUrls = await this.s3Service.uploadPlanetImages(s3Keys, images);

      const planet = await this.prisma.planet.create({
        data: {
          content,
          imageUrls,
          creatorId: userId,
        },
      });

      console.log(`Planet Created: ${planet.id}`);
      return planet;
    } catch (err: any) {
      if (err.uploadedKeys?.length) {
        await this.s3Service.deleteImagesByKey(err.uploadedKeys);
      }
      throw new BadRequestException('Create Planet Failed');
    }
  }

  async updatePlanet({
    planetId,
    content,
    userId,
  }: {
    planetId: number;
    content: string;
    userId: string;
  }) {
    const planet = await this.prisma.planet.findUnique({ where: { id: planetId } });

    if (!planet) {
      throw new NotFoundException('Planet not found.');
    }

    if (planet.creatorId !== userId)
      throw new ForbiddenException('You do not have permission to update this planet.');

    const updatedPlanet = await this.prisma.planet.update({
      where: { id: planetId },
      data: {
        content,
      },
    });

    return updatedPlanet;
  }

  getS3KeyFromUrl(url: string) {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return parts.slice(2).join('/');
  }

  async deletePlanet({ planetId, userId }: { planetId: number; userId: string }) {
    const planet = await this.prisma.planet.findUnique({ where: { id: planetId } });

    if (planet.creatorId !== userId)
      throw new ForbiddenException('You do not have permission to delete this planet.');

    const imageKeys = (planet.imageUrls || []).map((url) => this.getS3KeyFromUrl(url));

    if (imageKeys.length > 0) {
      await this.s3Service.deleteImagesByKey(imageKeys);
    }

    await this.prisma.planet.delete({ where: { id: planetId } });

    return planet;
  }

  async togglePlanetGravity({ planetId, userId }: { planetId: number; userId: string }) {
    const existing = await this.prisma.gravity.findUnique({
      where: {
        creatorId_planetId: {
          creatorId: userId,
          planetId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.gravity.delete({
          where: { id: existing.id },
        }),
        this.prisma.planet.update({
          where: { id: planetId },
          data: { gravityCount: { decrement: 1 } },
        }),
      ]);

      return { liked: false };
    }

    await this.prisma.$transaction([
      this.prisma.gravity.create({
        data: { creatorId: userId, planetId },
      }),
      this.prisma.planet.update({
        where: { id: planetId },
        data: { gravityCount: { increment: 1 } },
      }),
    ]);

    return { liked: true };
  }
}
