import { Test, TestingModule } from '@nestjs/testing';
import { MoonService } from './moon.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('MoonService', () => {
  let moonService: MoonService;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    mockPrismaService = {
      planet: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      gravity: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      moon: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();
    (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (ops) => ops);

    moonService = module.get<MoonService>(MoonService);
  });

  it('should be defined', () => {
    expect(moonService).toBeDefined();
  });

  describe('getMoonsByPlanet', () => {
    it('should return moons for a planet ordered by createdAt asc', async () => {
      const planetId = 1;

      const mockMoons = [
        {
          id: 1,
          name: 'Moon A',
          createdAt: new Date('2024-01-01'),
          creator: {
            id: 'user-1',
            stargate: { id: 10, starname: 'Alpha' },
          },
        },
      ];

      (mockPrismaService.moon.findMany as jest.Mock).mockResolvedValue(mockMoons);

      const result = await moonService.getMoonsByPlanet(planetId);

      expect(mockPrismaService.moon.findMany).toHaveBeenCalledWith({
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

      expect(result).toEqual(mockMoons);
    });
  });

  describe('createMoon', () => {
    it('creates a root moon when parentMoonId is not provided', async () => {
      const moon = { id: 1, content: 'hello' };
      const planet = { id: 1, moonCount: 1 };

      expect(mockPrismaService.moon.findUnique).not.toHaveBeenCalled();

      (mockPrismaService.moon.create as jest.Mock).mockResolvedValue(moon);
      (mockPrismaService.planet.update as jest.Mock).mockResolvedValue(planet);

      const result = await moonService.createMoon({
        planetId: 1,
        content: 'hello',
        creatorId: 'user-1',
        parentMoonId: null as any,
      });

      expect(mockPrismaService.moon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            planetId: 1,
            content: 'hello',
            creatorId: 'user-1',
            parentMoonId: null,
            rootMoonId: null,
          },
        })
      );

      expect(mockPrismaService.planet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: planet.id },
          data: {
            moonCount: { increment: 1 },
          },
        })
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);

      expect(result).toBe(moon);
    });

    it('creates a reply moon and sets rootMoonId correctly', async () => {
      (mockPrismaService.moon.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        rootMoonId: null,
      });

      const moon = { id: 20 };

      (mockPrismaService.moon.create as jest.Mock).mockResolvedValue(moon);

      const result = await moonService.createMoon({
        planetId: 1,
        content: 'reply',
        creatorId: 'user-1',
        parentMoonId: 10,
      });

      expect(mockPrismaService.moon.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: { id: true, rootMoonId: true },
      });

      expect(mockPrismaService.moon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            planetId: 1,
            content: 'reply',
            creatorId: 'user-1',
            parentMoonId: 10,
            rootMoonId: 10,
          },
        })
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);

      expect(result).toBe(moon);
    });

    it('throws if parent moon does not exist', async () => {
      (mockPrismaService.moon.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        moonService.createMoon({
          planetId: 1,
          content: 'reply',
          creatorId: 'user-1',
          parentMoonId: 999,
        })
      ).rejects.toThrow('Parent moon not found');

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('propagates prisma transaction errors', async () => {
      (mockPrismaService.$transaction as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        moonService.createMoon({
          planetId: 1,
          content: 'hello',
          creatorId: 'user-1',
          parentMoonId: null as any,
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('updateMoon', () => {
    it('throws BadRequestException if moon does not exist', async () => {
      (mockPrismaService.moon.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        moonService.updateMoon({
          moonId: 1,
          content: 'updated',
          creatorId: 'user-1',
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.moon.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if user is not the creator', async () => {
      (mockPrismaService.moon.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        creatorId: 'owner-id',
      });

      await expect(
        moonService.updateMoon({
          moonId: 1,
          content: 'updated',
          creatorId: 'other-user',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.moon.update).not.toHaveBeenCalled();
    });

    it('updates moon content when user is the creator', async () => {
      const updatedMoon = {
        id: 1,
        content: 'updated',
        creator: {
          stargate: { id: 1 },
        },
      };

      (mockPrismaService.moon.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        creatorId: 'user-1',
      });

      (mockPrismaService.moon.update as jest.Mock).mockResolvedValue(updatedMoon);

      const result = await moonService.updateMoon({
        moonId: 1,
        content: 'updated',
        creatorId: 'user-1',
      });

      expect(mockPrismaService.moon.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { content: 'updated' },
        })
      );

      expect(result).toBe(updatedMoon);
    });
  });
});
