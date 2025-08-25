import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { SignInCommandResult } from 'src/auth/command/signIn.command';

export class SignInRequestDto {
  @IsEmail()
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '사용자 로그인 코드',
    example: 'M24VJK',
  })
  code: string;
}

export class SignInResponseDto {
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  static fromCommandResult(result: SignInCommandResult): SignInResponseDto {
    const response = new SignInResponseDto();

    response.accessToken = result.accessToken;
    return response;
  }
}
