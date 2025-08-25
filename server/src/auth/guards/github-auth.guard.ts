/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ToolCredentialDto } from 'src/auth/dto/toolCreadential.dto';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  handleRequest<TUser = ToolCredentialDto>(
    err: any,
    user: TUser | null,
    _: any,
    __: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException(ExceptionMessage.GITHUB_AUTH_FAILED);
    }
    return user;
  }
}
