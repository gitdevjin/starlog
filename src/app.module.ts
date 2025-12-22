import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import authConfig from './config/auth.config';
import jwtConfig from './config/jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { GlobalTokenGuard } from './common/guard/global-token.guard';
import { PostModule } from './post/post.module';
import { S3Module } from './aws/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, jwtConfig],
    }),
    PrismaModule,
    S3Module,
    UserModule,
    AuthModule,
    ProfileModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalTokenGuard,
    },
  ],
})
export class AppModule {}
