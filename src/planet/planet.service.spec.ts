import { Test, TestingModule } from '@nestjs/testing';
import { PlanetService } from './planet.service';
import { S3Service } from 'src/aws/s3.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PlanetService', () => {
  let planetService: PlanetService;
  let mockS3Service: Partial<S3Service>;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    mockS3Service = {
      uploadPlanetImages: jest.fn(),
      deleteImagesByKey: jest.fn(),
    };

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
      $transaction: jest.fn(),
    } as any;

    (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (ops) => ops);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanetService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    planetService = module.get<PlanetService>(PlanetService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(planetService).toBeDefined();
  });

  describe('getPlanetById', () => {
    const basePlanet = {
      id: 1,
      name: 'Earth',
      moons: [
        {
          id: 10,
          name: 'Moon',
          childMoons: [],
        },
      ],
      creator: {
        id: 'user-1',
        stargate: { id: 99 },
      },
    };

    it('should return planet with isGravityOn = true when gravity exists', async () => {
      (mockPrismaService.planet.findUnique as jest.Mock).mockResolvedValue({
        ...basePlanet,
        gravities: [{ id: 123 }],
      } as any);

      const result = await planetService.getPlanetById({
        planetId: 1,
        userId: 'user-1',
      });

      expect(result.isGravityOn).toBe(true);
      expect(result.gravities).toBeUndefined();
      expect(result.id).toBe(1);

      expect(mockPrismaService.planet.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          moons: {
            include: {
              childMoons: true,
            },
          },
          gravities: {
            where: { creatorId: 'user-1' },
            select: { id: true },
          },
          creator: {
            include: { stargate: true },
          },
        },
      });
    });

    it('should return planet with isGravityOn = false when gravity does not exist', async () => {
      (mockPrismaService.planet.findUnique as jest.Mock).mockResolvedValue({
        ...basePlanet,
        gravities: [],
      } as any);

      const result = await planetService.getPlanetById({
        planetId: 1,
        userId: 'user-1',
      });

      expect(result.isGravityOn).toBe(false);
      expect(result.gravities).toBeUndefined();
    });

    it('should throw NotFoundException when planet does not exist', async () => {
      (mockPrismaService.planet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        planetService.getPlanetById({
          planetId: 999,
          userId: 'user-1',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUniverse', () => {
    it('should return planets with isGravityOn and exclude gravities', async () => {
      const mockPlanets = [
        {
          id: 1,
          name: 'Earth',
          createdAt: new Date('2025-12-01'),
          creator: { id: 'user-1', stargate: { id: 99 } },
          gravities: [{ id: 101 }],
        },
        {
          id: 2,
          name: 'Mars',
          createdAt: new Date('2025-11-01'),
          creator: { id: 'user-2', stargate: { id: 100 } },
          gravities: [],
        },
      ];

      // Mock Prisma findMany
      (mockPrismaService.planet.findMany as jest.Mock).mockResolvedValue(mockPlanets);

      const result = await planetService.getUniverse({
        from: 0,
        to: 1,
        userId: 'user-1',
      });

      // Check returned array length
      expect(result).toHaveLength(2);

      // Check isGravityOn and gravities removed
      expect(result[0].isGravityOn).toBe(true);
      expect(result[0].gravities).toBeUndefined();

      expect(result[1].isGravityOn).toBe(false);
      expect(result[1].gravities).toBeUndefined();

      // Check Prisma call
      expect(mockPrismaService.planet.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 2, // to - from + 1
        include: {
          creator: { include: { stargate: true } },
          gravities: { where: { creatorId: 'user-1' } },
        },
      });
    });
  });

  describe('createPlanet', () => {
    it('should create a planet successfully', async () => {
      const testFile = {
        fieldname: 'images',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
        size: 0,
      } as Express.Multer.File;

      // Mock successful S3 upload
      (mockS3Service.uploadPlanetImages as jest.Mock).mockResolvedValue([
        'http://mocked-url/test.png',
      ]);

      (mockPrismaService.planet.create as jest.Mock).mockResolvedValue({
        id: 'planet-id-123',
        content: 'test content',
        imageUrls: ['http://mocked-url/test.png'],
        creatorId: 'user-id-123',
      });

      const result = await planetService.createPlanet({
        userId: 'user-id-123',
        content: 'test content',
        images: [testFile],
      });

      expect(result.id).toBe('planet-id-123');
      expect(mockS3Service.uploadPlanetImages).toHaveBeenCalled();
      expect(mockPrismaService.planet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'test content',
            imageUrls: ['http://mocked-url/test.png'],
            creatorId: 'user-id-123',
          }),
        })
      );
    });

    it('should clean up uploaded images if S3 upload fails', async () => {
      const testFile = {
        fieldname: 'images',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
        size: 0,
      } as Express.Multer.File;

      (mockS3Service.uploadPlanetImages as jest.Mock).mockRejectedValue({
        error: new Error('S3 failed'),
        uploadedKeys: ['planets/user-id-123/test-key.png'],
      });

      await expect(
        planetService.createPlanet({
          userId: 'user-id-123',
          content: 'test content',
          images: [testFile],
        })
      ).rejects.toThrow('Create Planet Failed');

      expect(mockS3Service.deleteImagesByKey).toHaveBeenCalledWith([
        'planets/user-id-123/test-key.png',
      ]);
    });
  });

  describe('togglePlanetGravity', () => {
    const planetId = 1;
    const userId = 'user-1';

    it('should remove existing gravity and decrement count', async () => {
      (mockPrismaService.gravity.findUnique as jest.Mock).mockResolvedValue({
        id: 101,
        creatorId: userId,
        planetId,
      });

      (mockPrismaService.gravity.delete as jest.Mock).mockResolvedValue({ id: 101 });
      (mockPrismaService.planet.update as jest.Mock).mockResolvedValue({
        id: planetId,
        gravityCount: 0,
      });

      const result = await planetService.togglePlanetGravity({ planetId, userId });

      expect(result).toEqual({ liked: false });

      // Less loose assertion: check the exact calls to delete and update
      expect(mockPrismaService.gravity.delete).toHaveBeenCalledWith({
        where: { id: 101 },
      });

      expect(mockPrismaService.planet.update).toHaveBeenCalledWith({
        where: { id: planetId },
        data: { gravityCount: { decrement: 1 } },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should create gravity and increment count when not existing', async () => {
      // simulate no existing gravity
      (mockPrismaService.gravity.findUnique as jest.Mock).mockResolvedValue(null);

      (mockPrismaService.gravity.create as jest.Mock).mockResolvedValue({
        id: 102,
        creatorId: userId,
        planetId,
      });
      (mockPrismaService.planet.update as jest.Mock).mockResolvedValue({
        id: planetId,
        gravityCount: 1,
      });

      const result = await planetService.togglePlanetGravity({ planetId, userId });

      expect(result).toEqual({ liked: true });

      expect(mockPrismaService.gravity.create).toHaveBeenCalledWith({
        data: { creatorId: userId, planetId },
      });

      expect(mockPrismaService.planet.update).toHaveBeenCalledWith({
        where: { id: planetId },
        data: { gravityCount: { increment: 1 } },
      });

      // $transaction was still called
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
