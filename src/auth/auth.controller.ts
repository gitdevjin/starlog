import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  postRegisterWithEmail(@Body() body: CreateUserDto) {
    return this.authService.registerWithEmail(body);
  }
}
