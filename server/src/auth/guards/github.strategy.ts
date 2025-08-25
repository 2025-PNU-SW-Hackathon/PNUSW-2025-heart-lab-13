import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ToolCredentialDto } from 'src/auth/dto/toolCreadential.dto';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      clientID: configService.get<string>('github.clientId') || '',
      clientSecret: configService.get<string>('github.clientSecret') || '',
      callbackURL: configService.get<string>('github.callbackUrl') || '',
      scope: ['user:email', 'repo', 'read:org'],
      passReqToCallback: true,
    });
  }
  validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): ToolCredentialDto {
    if (!accessToken || !profile) {
      throw new UnauthorizedException(ExceptionMessage.GITHUB_AUTH_FAILED);
    }

    // GitHub OAuth는 refresh token을 제공하지 않으므로 null로 설정
    const credential: ToolCredentialDto = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      userId: (req?.user.userId ?? '') as string,
      accessToken,
      refreshToken: refreshToken,
    };

    return credential;
  }
}
