import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  hashRounds: number;
}

export default registerAs<AuthConfig>('auth', () => {
  return {
    hashRounds: 10,
  };
});
