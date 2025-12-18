import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from 'src/types';
import { CurrentUser } from 'src/common/decorator/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUserWithEmail(dto);
  }

  @Get('me')
  getUser(@CurrentUser() user: UserEntity) {
    return user;
  }
}
