import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUserDto } from 'src/auth/dto/authUser.dto';
import { JwtPayload } from 'src/auth/dto/jwtPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const cookie = req?.headers?.cookie as string | undefined;
          if (!cookie) return null;

          const token = cookie.split('w_auth=')[1];

          return token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
      passReqToCallback: true,
    });
  }

  validate(req: any, payload: JwtPayload): AuthUserDto {
    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
    };
  }
}
