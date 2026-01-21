import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MoonService {
  constructor(private readonly prisma: PrismaService) {}

  async getMoonsByPlanet(planetId: number) {
    const moons = await this.prisma.moon.findMany({
      where: { planetId },
      include: {
        creator: {
          include: {
            stargate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return moons;
  }

  async createMoon({
    planetId,
    content,
    creatorId,
    parentMoonId,
  }: {
    planetId: number;
    content: string;
    creatorId: string;
    parentMoonId: number;
  }) {
    let rootMoonId: number | null = null;

    if (parentMoonId) {
      const parentMoon = await this.prisma.moon.findUnique({
        where: { id: parentMoonId },
        select: { id: true, rootMoonId: true },
      });

      if (!parentMoon) {
        throw new Error('Parent moon not found');
      }

      rootMoonId = parentMoon.rootMoonId ?? parentMoon.id;
    }

    const [moon, updatedPlanet] = await this.prisma.$transaction([
      this.prisma.moon.create({
        data: {
          creatorId,
          content,
          planetId,
          parentMoonId, // optional
          rootMoonId,
        },
        include: {
          creator: {
            include: {
              stargate: true,
            },
          },
        },
      }),
      this.prisma.planet.update({
        where: { id: planetId },
        data: {
          moonCount: { increment: 1 },
        },
      }),
    ]);

    return moon;
  }

  async updateMoon({
    moonId,
    content,
    creatorId,
  }: {
    moonId: number;
    content: string;
    creatorId: string;
  }) {
    const existingMoon = await this.prisma.moon.findUnique({ where: { id: moonId } });

    if (!existingMoon) throw new BadRequestException("The Moon doesn't exist");

    if (existingMoon.creatorId !== creatorId)
      throw new ForbiddenException('You do not have permission to update this moon.');

    return await this.prisma.moon.update({
      where: { id: moonId },
      data: {
        content,
      },
      include: {
        creator: {
          include: {
            stargate: true,
          },
        },
      },
    });
  }
}
