import { registerAs } from '@nestjs/config';
import ms from 'ms';

export interface JwtConfig {
  secret: string;
  accessTokenTtl: ms.StringValue;
  refreshTokenTtl: ms.StringValue;
}

export default registerAs<JwtConfig>('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    accessTokenTtl: '3600s',
    refreshTokenTtl: '7D',
  };
});
