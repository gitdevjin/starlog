import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockConfigService: Partial<ConfigService>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
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

    mockJwtService = { sign: jest.fn(), verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks(); // resets manual mocks (calls, return values)
    jest.restoreAllMocks(); // restores original implementations for spies
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('extractTokenFromHeader function', () => {
    it('basic token should be extracted correctly', () => {
      const scheme = 'basic';
      const token = '!@#$#abcd';
      const result = authService.extractTokenFromHeader(`${scheme} ${token}`);
      expect(result).toBe(token);
    });

    it('Token Scheme should be case-insensitive', () => {
      const scheme = 'Basic';
      const token = '!@#$#abcd';
      const result = authService.extractTokenFromHeader(`${scheme} ${token}`);
      expect(result).toBe(token);
    });

    it('Scheme Mismatch Should throw Error', () => {
      const scheme = 'wrongBearer';
      const token = '!@#$#abcd';
      expect(() => authService.extractTokenFromHeader(`${scheme} ${token}`)).toThrow(
        BadRequestException
      );
    });

    it('Authorization Header of Wrong Format Should throw Error', () => {
      const scheme = 'Basic';
      const token = '!@#$#abcd';
      expect(() => authService.extractTokenFromHeader(`${scheme} ${token} asdfgh`)).toThrow(
        BadRequestException
      );
    });
  });
});
