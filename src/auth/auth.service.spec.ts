import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockConfigService: Partial<ConfigService>;
  let mockJwtService: Partial<JwtService>;
  let mockUserService: Partial<UserService>;

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

    mockUserService = {
      createUserWithEmail: jest.fn(),
    };

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
        {
          provide: UserService,
          useValue: mockUserService,
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

  describe('signToken function', () => {
    it('should call jwtService.sign with correct arguments when creating an access token', () => {
      (mockJwtService.sign as jest.Mock).mockReturnValue('mockTestResult');

      const token = authService['signToken']('testRandomUserId', 'access');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'testRandomUserId',
          type: 'access',
        },
        {
          secret: 'secret-string',
          expiresIn: '3600s',
        }
      );

      expect(token).toBe('mockTestResult');
    });

    it('should call jwtService.sign with correct arguments when creating an refresh token', () => {
      (mockJwtService.sign as jest.Mock).mockReturnValue('mockTestResult');

      const token = authService['signToken']('testRandomUserId', 'refresh');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'testRandomUserId',
          type: 'refresh',
        },
        {
          secret: 'secret-string',
          expiresIn: '7d',
        }
      );

      expect(token).toBe('mockTestResult');
    });
  });

  describe('generateToken', () => {
    it('should call signToken for both access and refresh tokens', () => {
      const userId = 'fakeUserId';

      const signTokenSpy = jest
        .spyOn(authService as any, 'signToken')
        .mockImplementation((userId, type) =>
          type === 'access' ? 'mockAccessToken' : 'mockRefreshToken'
        );

      const tokens = authService['generateTokens'](userId);

      expect(signTokenSpy).toHaveBeenCalledTimes(2);
      expect(signTokenSpy).toHaveBeenCalledWith(userId, 'access');
      expect(signTokenSpy).toHaveBeenCalledWith(userId, 'refresh');

      expect(tokens).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload when token is valid', () => {
      const token = 'fakeToken';
      const decodedPayload = { email: 'test@test.com', sub: 'fakeUserId', type: 'access' };

      (mockJwtService.verify as jest.Mock).mockReturnValue(decodedPayload);

      const result = authService.verifyToken(token);

      expect(result).toEqual(decodedPayload);
      expect(mockConfigService.get).toHaveBeenCalledWith('jwt');
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, { secret: 'secret-string' });
    });

    //probably I should add a test for catching error
  });

  describe('registerWithEmail', () => {
    it('should hash the password and create a new user', async () => {
      const userDto = { email: 'test@test.com', password: 'testPassword' };
      const hashedPwd = 'fakeHash';
      const createdUser = { id: 'fakeUserId', email: 'test@test.com' };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPwd);

      (mockUserService.createUserWithEmail as jest.Mock).mockResolvedValue(createdUser);

      const result = await authService.registerWithEmail(userDto);

      expect(mockConfigService.get).toHaveBeenCalledWith('auth');
      expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 10);
      expect(mockUserService.createUserWithEmail).toHaveBeenCalledWith({
        ...userDto,
        password: hashedPwd,
      });

      expect(result).toEqual(createdUser);
    });
  });
});
