import { Test, TestingModule } from '@nestjs/testing';
import { StargateService } from './stargate.service';
import { PrismaService } from 'src/prisma/prisma.service';

import * as randomNameGen from 'src/utils/random-name-generator';
import { S3Service } from 'src/aws/s3.service';

jest.mock('src/utils/random-name-generator');
describe('StargateService', () => {
  let service: StargateService;
  let mockS3Service: Partial<S3Service>;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    mockPrismaService = {
      stargate: {
        create: jest.fn(),
      } as any,
    };

    mockS3Service = {
      uploadPlanetImages: jest.fn(),
      deleteImagesByKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StargateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<StargateService>(StargateService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a stargate with a random starname', async () => {
    // Arrange
    const userId = 'fake-user-123';
    const starname = 'cool-cat';

    (randomNameGen.getRandomNickname as jest.Mock).mockReturnValue('cool-cat');

    const expectedStargate = {
      id: 1,
      userId,
      starname,
    };

    (mockPrismaService.stargate.create as jest.Mock).mockResolvedValue(expectedStargate);

    // Act
    const result = await service.createStargate(userId);

    // Assert
    expect(randomNameGen.getRandomNickname).toHaveBeenCalled();

    expect(mockPrismaService.stargate.create).toHaveBeenCalledWith({
      data: {
        userId,
        starname,
      },
    });

    expect(result).toEqual(expectedStargate);
  });
});
