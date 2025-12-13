import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';

describe('UserService', () => {
  let service: UserService;
  let mockPrismaService: Partial<PrismaService>;
  let mockProfileService: Partial<ProfileService>;

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      } as any,
    };

    mockProfileService = {
      createProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
