import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';
import { userPublicSelect } from 'src/prisma/prisma.select';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  async createUserWithEmail(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: dto.password,
      },
      select: userPublicSelect,
    });

    const profile = await this.profileService.createProfile(user.id);

    return { ...user, profile };
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
