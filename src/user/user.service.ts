import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';
import { userPublicSelect } from 'src/prisma/prisma.select';
import * as bcrypt from 'bcrypt';
import { AuthConfig } from 'src/config/auth.config';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/types';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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

  async getUserByEmail(email: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: { profile: true },
    });
  }

  async updateRefreshToken({ userId, refreshToken }: { userId: string; refreshToken: string }) {
    const hashedToken = await bcrypt.hash(
      refreshToken,
      this.configService.get<AuthConfig>('auth').hashRounds
    );

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: hashedToken,
      },
    });

    return result;
  }
}
