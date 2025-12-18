import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { ACCESS_TYPE_KEY, AccessTypeValue } from '../decorator/access-type.decorator';

@Injectable()
export class GlobalTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredType =
      this.reflector.getAllAndOverride<AccessTypeValue>(ACCESS_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'access';

    const req = context.switchToHttp().getRequest();

    if (requiredType === 'public') {
      return true;
    }

    const token = requiredType === 'access' ? req.cookies.accessToken : req.cookies.refreshToken;
    const payload = this.authService.verifyToken(token);

    const user = await this.userService.getUserById(payload.sub);

    req.token = token;
    req.tokenType = payload.type;
    req.user = user;

    return true;
  }
}
