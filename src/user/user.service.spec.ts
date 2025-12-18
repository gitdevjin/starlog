import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserPublicSelect } from 'src/prisma/prisma.select';

describe('UserService', () => {
  let userService: UserService;
  let mockConfigService: Partial<ConfigService>;
  let mockPrismaService: Partial<PrismaService>;
  let mockProfileService: Partial<ProfileService>;

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      profile: {
        create: jest.fn(),
      },
    } as any;

    mockProfileService = {
      createProfile: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt') {
          return { secret: 'secret-string', accessTokenTtl: '3600s', refreshTokenTtl: '7d' };
        }

        if (key === 'auth') {
          return { hashRounds: 10 };
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
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

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('CreateUserWithEmail', () => {
    it('should create a new user with profile', async () => {
      const dto = { email: 'test@test.com', password: '12345678' };
      const createdUser = { id: '1', email: dto.email };

      // Mock Prisma findUnique to return null (no existing user)
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock Prisma create to return createdUser
      (mockPrismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      // Mock profileService.createProfile to return profile
      (mockProfileService.createProfile as jest.Mock).mockResolvedValue({ nickname: 'test' });

      const result = await userService.createUserWithEmail(dto as any);

      expect(result).toEqual({
        ...createdUser,
        profile: { nickname: 'test' },
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockProfileService.createProfile).toHaveBeenCalledWith('1');
    });

    it('should throw BadRequestException if email exists', async () => {
      const dto = { email: 'test@test.com', password: '12345678' };

      // Mock existing user
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: dto.email,
      });

      await expect(userService.createUserWithEmail(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user with profile', async () => {
      const email = 'test@test.com';

      const mockUser = {
        id: '1',
        email,
        password: 'hashedPassword',
        createdAt: new Date(),
        profile: {
          id: 1,
          nickname: 'testnick',
          firstName: 'Test',
          lastName: 'User',
          bio: 'Hello',
          dob: new Date('2000-01-01'),
          avatarUrl: 'avatar.png',
          userId: '1',
        },
      };

      // Mock findUnique to return mockUser
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { profile: true },
      });
    });
  });

  describe('getUserById', () => {
    it('should return user with profile', async () => {
      const userId = '1234';

      const mockUser = {
        id: '1',
        email: 'test@test.com',
        createdAt: new Date(),
        profile: {
          id: 1,
          nickname: 'testnick',
          firstName: 'Test',
          lastName: 'User',
          bio: 'Hello',
          dob: new Date('2000-01-01'),
          avatarUrl: 'avatar.png',
          userId: '1',
        },
      };

      // Mock findUnique to return mockUser
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: UserPublicSelect,
      });
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash refresh token and update it in DB', async () => {
      const input = {
        userId: 'user-123',
        refreshToken: 'plain-refresh-token',
      };

      (mockPrismaService.user.update as jest.Mock).mockResolvedValue({
        id: input.userId,
        refreshToken: 'hashed-refresh-token',
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token');

      const result = await userService.updateRefreshToken(input);

      expect(mockConfigService.get).toHaveBeenCalledWith('auth');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-refresh-token', 10);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: input.userId },
        data: { refreshToken: 'hashed-refresh-token' },
      });

      expect(result.refreshToken).toBe('hashed-refresh-token');
    });
  });
});
