import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { SaveGithubCredentialCommand } from 'src/auth/command/saveGithubCredential.command';
import {
  SignInCommand,
  SignInCommandResult,
} from 'src/auth/command/signIn.command';
import {
  SignUpCommand,
  SignUpCommandResult,
} from 'src/auth/command/signUp.command';
import { AuthUserDto } from 'src/auth/dto/authUser.dto';
import { EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTE } from 'src/auth/model/emailVerification/emailVerification.const';
import { EmailVerificationToken } from 'src/auth/model/emailVerification/emailVerificationToken.entity';
import { EmailVerificationTokenFactory } from 'src/auth/model/emailVerification/factory/emailVerificationToken.factory';
import { LoginCodeFactory } from 'src/auth/model/loginCode/factory/loginCode.factory';
import { LOGIN_CODE_EXPIRE_MINUTE } from 'src/auth/model/loginCode/loginCode.const';
import { LoginCode } from 'src/auth/model/loginCode/loginCode.entity';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import { EmailService } from 'src/email/email.service';
import { LoginCodeGeneratorHelper } from 'src/helper/loginCodeGenerator.helper';
import { TokenGeneratorHelper } from 'src/helper/tokenGenerator.helper';
import { UrlBuilderHelper } from 'src/helper/urlBuilder.helper';
import { ToolCredentialFactory } from 'src/user/model/factory/toolCredential.factory';
import { UserFactory } from 'src/user/model/factory/user.factory';
import { TOOL_TYPE } from 'src/user/model/toolType.const';
import { User } from 'src/user/model/user.entity';
import { MoreThan, Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userFactory: UserFactory,
    private readonly toolCredentialFactory: ToolCredentialFactory,
    private readonly jwtService: JwtService,
    private readonly tokenGeneratorHelper: TokenGeneratorHelper,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    private readonly emailVerificationTokenFactory: EmailVerificationTokenFactory,
    private readonly emailService: EmailService,
    private readonly urlBuilderHelper: UrlBuilderHelper,
    private readonly loginCodeFactory: LoginCodeFactory,
    private readonly loginCodeGeneratorHelper: LoginCodeGeneratorHelper,
    @InjectRepository(LoginCode)
    private readonly loginCodeRepository: Repository<LoginCode>,
  ) {}

  async sendSignInEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(ExceptionMessage.USER_NOT_FOUND);
    }

    const existingCodes = await this.loginCodeRepository.find({
      where: { userId: user.id },
    });

    await Promise.all(
      existingCodes.map(async (code) => this.loginCodeRepository.remove(code)),
    );

    const code = this.loginCodeGeneratorHelper.generateCode();

    const loginCode = this.loginCodeFactory.create({
      userId: user.id,
      code,
    });

    await this.loginCodeRepository.save(loginCode);
    await this.emailService.sendSignInCode({
      to: user.email,
      code,
      expirationTime: LOGIN_CODE_EXPIRE_MINUTE,
    });
  }

  async signIn(command: SignInCommand): Promise<SignInCommandResult> {
    const { email, code } = command;

    const user: User | null = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(ExceptionMessage.USER_NOT_FOUND);
    }

    const loginCode = await this.loginCodeRepository.findOne({
      where: { userId: user.id, expiresAt: MoreThan(new Date()) },
    });

    if (!loginCode || loginCode.code !== code) {
      throw new UnprocessableEntityException(
        ExceptionMessage.INVALID_LOGIN_CODE,
      );
    }

    await this.loginCodeRepository.remove(loginCode);

    const authUserDto: AuthUserDto = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
    const token = await this.generateJwtToken(authUserDto);

    return {
      accessToken: token,
    };
  }

  async sendSignUpEmail(email: string): Promise<void> {
    const existUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existUser) {
      throw new UnprocessableEntityException(
        ExceptionMessage.USER_ALREADY_EXISTS,
      );
    }

    const existEmailVerificationTokens =
      await this.emailVerificationTokenRepository.find({
        where: { email, expiresAt: MoreThan(new Date()) },
      });

    const updateTokenPromises = existEmailVerificationTokens.map(
      async (token) => {
        token.expiresAt = new Date();
        await this.emailVerificationTokenRepository.save(token);
      },
    );

    await Promise.all(updateTokenPromises);

    const { token, hash } = this.tokenGeneratorHelper.generateToken();
    const signUpToken = this.emailVerificationTokenFactory.create({
      email,
      token,
      hash,
    });

    await this.emailVerificationTokenRepository.save(signUpToken);
    await this.emailService.sendEmailVerification({
      to: email,
      verificationUrl: this.urlBuilderHelper.buildVerificationUrl({
        email,
        token,
      }),
      expirationTime: EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTE,
    });
  }

  async signUp(command: SignUpCommand): Promise<SignUpCommandResult> {
    const { email, username, token } = command;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new UnprocessableEntityException(
        ExceptionMessage.USER_ALREADY_EXISTS,
      );
    }

    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findOne({
        where: { email, expiresAt: MoreThan(new Date()) },
      });

    if (!emailVerificationToken) {
      throw new UnprocessableEntityException(
        ExceptionMessage.EMAIL_VERIFICATION_TOKEN_NOT_FOUND,
      );
    }

    const hash = createHash('sha256').update(token).digest();

    if (!emailVerificationToken.hash.equals(hash)) {
      throw new UnprocessableEntityException(
        ExceptionMessage.INVALID_EMAIL_VERIFICATION_TOKEN,
      );
    }

    emailVerificationToken.expiresAt = new Date();

    const newUser = this.userFactory.create({
      email,
      username,
    });
    await this.userRepository.save(newUser);

    return {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
    };
  }

  async saveGithubCredential(
    command: SaveGithubCredentialCommand,
  ): Promise<void> {
    const { userId, accessToken, refreshToken } = command;

    if (!accessToken) {
      throw new UnauthorizedException(ExceptionMessage.GITHUB_AUTH_FAILED);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(ExceptionMessage.USER_NOT_FOUND);
    }

    const existingCredential = user.toolCredentials?.find(
      (cred) => cred.toolType === TOOL_TYPE.GITHUB,
    );

    if (existingCredential) {
      existingCredential.accessToken = accessToken;
      existingCredential.refreshToken = refreshToken ?? null;
      existingCredential.updatedAt = new Date();
    } else {
      const newCredential = this.toolCredentialFactory.create({
        accessToken,
        refreshToken,
        toolType: TOOL_TYPE.GITHUB,
        user,
      });

      const credentialArr = [...(user.toolCredentials || []), newCredential];
      user.toolCredentials = credentialArr;
    }

    await this.userRepository.save(user);
  }

  private async generateJwtToken(authUserDto: AuthUserDto): Promise<string> {
    const { userId, username, email } = authUserDto;
    const payload = { userId, username, email };

    return await this.jwtService.signAsync(payload);
  }
}
