import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import { UserEntity } from 'src/types';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only images allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    })
  )
  postCreatePost(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreatePostDto,
    @UploadedFiles() images: Express.Multer.File[]
  ) {
    return this.postService.createPost({ userId: user.id, content: dto.content, images });
  }
}
