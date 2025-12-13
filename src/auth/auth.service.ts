import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig } from 'src/config/jwt.config';
import { JwtPayload } from 'src/types';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthConfig } from 'src/config/auth.config';
import * as bcrypt from 'bcrypt';

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
}
