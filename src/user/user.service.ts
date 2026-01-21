import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StargateService } from 'src/stargate/stargate.service';
import { UserPublicSelect } from 'src/prisma/prisma.select';
import * as bcrypt from 'bcrypt';
import { AuthConfig } from 'src/config/auth.config';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/types';
import { isUUID } from 'class-validator';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly stargateService: StargateService
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
      select: UserPublicSelect,
    });

    const stargate = await this.stargateService.createStargate(user.id);

    return { ...user, stargate };
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: { stargate: true },
    });
  }

  async getUserById(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // Optional but STRONGLY recommended
    if (!isUUID(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    const userWithStargate = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: UserPublicSelect,
    });

    if (!userWithStargate) {
      throw new NotFoundException('User not found');
    }

    return userWithStargate;
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
