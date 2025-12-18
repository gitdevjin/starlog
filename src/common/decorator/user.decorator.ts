import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserEntity } from 'src/types';

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user as UserEntity;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user;
  }
);
