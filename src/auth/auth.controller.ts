import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Response } from 'express';
import { AccessTokenType } from 'src/common/decorator/access-type.decorator';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import { UserEntity } from 'src/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  @AccessTokenType('public')
  postRegisterWithEmail(@Body() body: CreateUserDto) {
    return this.authService.registerWithEmail(body);
  }

  @Post('login/email')
  @AccessTokenType('public')
  async postLoginWithEmail(
    @Res({ passthrough: true }) res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const base64string = this.authService.extractTokenFromHeader(authHeader);
    const credentials = this.authService.decodeBasicToken(base64string);

    const { accessToken, refreshToken, accessCookieOptions, refreshCookieOptions } =
      await this.authService.loginWithEmail(credentials);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return { message: 'login successful' };
  }

  @Post('refresh')
  @AccessTokenType('refresh')
  async postRefreshToken(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: UserEntity
  ) {
    const { accessToken, refreshToken, accessCookieOptions, refreshCookieOptions } =
      await this.authService.refreshTokens(user.id);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return { message: 'Token Refresh successful' };
  }
}
