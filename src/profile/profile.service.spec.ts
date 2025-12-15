import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from 'src/prisma/prisma.service';

import * as randomNameGen from 'src/utils/random-name-generator';

jest.mock('src/utils/random-name-generator');
describe('ProfileService', () => {
  let service: ProfileService;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    mockPrismaService = {
      profile: {
        create: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a profile with a random nickname', async () => {
    // Arrange
    const userId = 'fake-user-123';
    const nickname = 'cool-cat';

    (randomNameGen.getRandomNickname as jest.Mock).mockReturnValue('cool-cat');

    const expectedProfile = {
      id: 1,
      userId,
      nickname,
    };

    (mockPrismaService.profile.create as jest.Mock).mockResolvedValue(expectedProfile);

    // Act
    const result = await service.createProfile(userId);

    // Assert
    expect(randomNameGen.getRandomNickname).toHaveBeenCalled();

    expect(mockPrismaService.profile.create).toHaveBeenCalledWith({
      data: {
        userId,
        nickname,
      },
    });

    expect(result).toEqual(expectedProfile);
  });
});
