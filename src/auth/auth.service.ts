import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { JwtConfig } from 'src/config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
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
}
