import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig } from 'src/config/jwt.config';
import { JwtPayload } from 'src/types';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthConfig } from 'src/config/auth.config';
import { CookieOptions } from 'express';
import * as bcrypt from 'bcrypt';
import * as ms from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  extractTokenFromHeader(authHeader: string) {
    const splitAuthHeader = authHeader.split(' ');

    if (splitAuthHeader.length !== 2) {
      throw new BadRequestException('Invalid Authorization header format');
    }

    const [scheme, token] = splitAuthHeader;

    if (scheme.toLowerCase() !== 'basic') {
      throw new BadRequestException('Invalid authentication scheme');
    }

    return token;
  }

  decodeBasicToken(base64Credential: string) {
    const decodedCredential = Buffer.from(base64Credential, 'base64').toString('utf8');

    const separatorIdx = decodedCredential.indexOf(':');

    if (separatorIdx === -1) {
      throw new UnauthorizedException(
        'Invalid Basic authentication format. Expected "email:password"'
      );
    }

    const email = decodedCredential.slice(0, separatorIdx);
    const password = decodedCredential.slice(separatorIdx + 1);

    if (!email || !password) {
      throw new UnauthorizedException('Email or password cannot be empty in Basic authentication');
    }

    return { email, password };
  }

  private signToken(userId: string, tokenType: 'access' | 'refresh') {
    const { secret, accessTokenTtl, refreshTokenTtl } = this.configService.get<JwtConfig>('jwt');

    const payload = {
      sub: userId,
      type: tokenType,
    };

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: tokenType === 'access' ? accessTokenTtl : refreshTokenTtl,
    });

    return token;
  }

  private generateTokens(userId: string) {
    return {
      accessToken: this.signToken(userId, 'access'),
      refreshToken: this.signToken(userId, 'refresh'),
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<JwtConfig>('jwt').secret,
      });
    } catch (err) {
      throw new UnauthorizedException(err.message || 'Token verification failed');
    }
  }

  async registerWithEmail(user: CreateUserDto) {
    const hash = await bcrypt.hash(
      user.password,
      this.configService.get<AuthConfig>('auth').hashRounds
    );

    const newUser = await this.userService.createUserWithEmail({
      ...user,
      password: hash,
    });

    return newUser;
  }

  private async authenticateUserWithEmail({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const userRecord = await this.userService.getUserByEmail(email);

    if (!userRecord) {
      throw new UnauthorizedException('Invalid email');
    }

    const isPasswordValid = await bcrypt.compare(password, userRecord.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return userRecord;
  }

  private async issueTokensAndCookies(userId: string) {
    const tokens = this.generateTokens(userId);

    const refreshTtl = this.configService.get<JwtConfig>('jwt').refreshTokenTtl;
    const accessTtl = this.configService.get<JwtConfig>('jwt').accessTokenTtl;

    const refreshCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true, // must be true if sameSite is 'none'
      sameSite: 'none',
      maxAge: ms(refreshTtl),
    };

    const accessCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(accessTtl),
    };

    await this.userService.updateRefreshToken({
      userId,
      refreshToken: tokens.refreshToken,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessCookieOptions,
      refreshCookieOptions,
    };
  }

  async loginWithEmail({ email, password }: { email: string; password: string }) {
    const userRecord = await this.authenticateUserWithEmail({ email, password });
    return this.issueTokensAndCookies(userRecord.id);
  }

  async refreshTokens(userId: string) {
    return this.issueTokensAndCookies(userId);
  }
}
