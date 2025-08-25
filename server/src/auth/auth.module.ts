import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubStrategy } from './guards/github.strategy';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PasswordEncryptor } from 'src/auth/password.encryptor';
import { JwtStrategy } from 'src/auth/guards/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationToken } from 'src/auth/model/emailVerification/emailVerificationToken.entity';
import { EmailVerificationTokenFactory } from 'src/auth/model/emailVerification/factory/emailVerificationToken.factory';
import { EmailModule } from 'src/email/email.module';
import { LoginCodeFactory } from 'src/auth/model/loginCode/factory/loginCode.factory';
import { LoginCode } from 'src/auth/model/loginCode/loginCode.entity';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UserModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
    }),
    TypeOrmModule.forFeature([EmailVerificationToken, LoginCode]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GithubStrategy,
    JwtStrategy,
    PasswordEncryptor,
    EmailVerificationTokenFactory,
    LoginCodeFactory,
  ],
})
export class AuthModule {}
