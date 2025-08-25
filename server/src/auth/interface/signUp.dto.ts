import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { SignUpCommandResult } from 'src/auth/command/signUp.command';

export class SignUpRequestDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '이메일 인증링크에 포함된 토큰',
    example: 'password123',
  })
  token: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @ApiProperty({
    description: '사용자 이름',
    example: 'username123',
  })
  username: string;
}

export class SignUpResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: '사용자 이름',
    example: 'username123',
  })
  username: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  static fromCommandResult(result: SignUpCommandResult): SignUpResponseDto {
    const response = new SignUpResponseDto();

    response.userId = result.userId;
    response.username = result.username;
    response.email = result.email;
    return response;
  }
}
