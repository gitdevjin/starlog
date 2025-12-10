import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}
  async getHello() {
    const user = await this.prismaService.user.findMany();

    console.log(user);
    return 'welcome to starlog!';
  }
}
