import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Body,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ToolCredentialDto } from 'src/auth/dto/toolCreadential.dto';
import { AuthService } from 'src/auth/auth.service';
import {
  SignInRequestDto,
  SignInResponseDto,
} from 'src/auth/interface/signIn.dto';
import { SignInCommandResult } from 'src/auth/command/signIn.command';
import { SignUpCommandResult } from 'src/auth/command/signUp.command';
import {
  SignUpRequestDto,
  SignUpResponseDto,
} from 'src/auth/interface/signUp.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { SendSignUpEmailRequestDto } from 'src/auth/interface/sendSignUpEmail.dto';
import { SendSignInEmailRequestDto } from 'src/auth/interface/sendSignInEmail.dto';

@ApiTags('/auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard) // Ensure the user is authenticated before accessing GitHub auth
  @UseGuards(GithubAuthGuard)
  @ApiOperation({
    summary: 'Github 로그인 화면으로 리다이렉트',
    description: '사용자를 Github 로그인 페이지로 리다이렉트합니다.',
  })
  @ApiCookieAuth('w_auth')
  @Get('github')
  async githubAuth() {
    // Passport will handle the redirect to GitHub
  }

  @UseGuards(GithubAuthGuard)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Github 인증 콜백',
    description: '사용자가 Github 인증 후 리다이렉트되는 엔드포인트입니다.',
  })
  @ApiCookieAuth('w_auth')
  @Get('github/callback')
  async githubCallback(@Req() req: Request) {
    const credential: ToolCredentialDto = req.user as ToolCredentialDto;

    await this.authService.saveGithubCredential({
      userId: credential.userId,
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
    });
  }

  @ApiOperation({
    summary: '로그인 코드 전송',
    description: '사용자가 로그인 코드를 요청합니다.',
  })
  @ApiOkResponse({
    description: '로그인 코드 전송 성공',
  })
  @Post('sign-in/code')
  async sendSignInEmail(
    @Body() body: SendSignInEmailRequestDto,
  ): Promise<void> {
    await this.authService.sendSignInEmail(body.email);
  }

  @ApiOperation({
    summary: '로그인',
    description: '사용자가 이메일과 비밀번호로 로그인합니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공(accessToken을 w_auth 쿠키에 저장)',
    type: SignInResponseDto,
  })
  @Post('sign-in')
  async signIn(
    @Body() body: SignInRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignInResponseDto> {
    const result: SignInCommandResult = await this.authService.signIn({
      email: body.email,
      code: body.code,
    });

    res.cookie('w_auth', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return {
      accessToken: result.accessToken,
    };
  }

  @Post('/sign-up/email')
  @ApiOperation({
    summary: '회원가입 이메일 전송',
    description:
      '사용자가 회원가입을 위해 이메일을 입력하고 인증 메일을 받습니다.',
  })
  @ApiCreatedResponse({
    description: '회원가입 이메일 전송 성공',
  })
  async sendSignUpEmail(
    @Body() body: SendSignUpEmailRequestDto,
  ): Promise<void> {
    await this.authService.sendSignUpEmail(body.email);
  }

  @ApiOperation({
    summary: '회원가입',
    description: '사용자가 이메일, 사용자 이름, 비밀번호로 회원가입합니다.',
  })
  @ApiOkResponse({
    description: '회원가입 성공',
    type: SignUpResponseDto,
  })
  @Post('sign-up')
  async signUp(@Body() body: SignUpRequestDto): Promise<SignUpResponseDto> {
    const result: SignUpCommandResult = await this.authService.signUp({
      email: body.email,
      username: body.username,
      token: body.token,
    });

    return {
      userId: result.userId,
      username: result.username,
      email: result.email,
    };
  }
}
