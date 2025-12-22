import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import path from 'path';
import { S3Service } from 'src/aws/s3.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService
  ) {}

  async createPost({
    userId,
    content,
    images,
  }: {
    userId: string;
    content: string;
    images: Express.Multer.File[];
  }) {
    const s3Keys = images.map(
      (file) => `posts/${userId}/${randomUUID()}${path.extname(file.originalname)}`
    );

    try {
      const imageUrls = await this.s3Service.uploadPostImages(s3Keys, images);

      const post = await this.prisma.post.create({
        data: {
          content,
          imageUrls,
          authorId: userId,
        },
      });

      console.log('Post Created');
      return post;
    } catch (error) {
      await this.s3Service.deleteImagesByKey(s3Keys);

      throw new BadRequestException('Create Post Failed');
    }
  }
}
