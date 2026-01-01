import { Test, TestingModule } from '@nestjs/testing';
import { MoonService } from './moon.service';
import { PrismaService } from 'src/prisma/prisma.service';

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

    moonService = module.get<MoonService>(MoonService);
  });

  it('should be defined', () => {
    expect(moonService).toBeDefined();
  });
});
