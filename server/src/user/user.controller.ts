import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUserDto } from 'src/auth/dto/authUser.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUserInfoResponseDto } from 'src/user/interface/getUserInfo.dto';
import {
  GetUserInfoQuery,
  GetUserInfoQueryResult,
} from 'src/user/query/getUesrInfo.query';
import { UserService } from 'src/user/user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '현재 로그인한 사용자 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: '현재 로그인한 사용자의 정보 조회 성공',
    type: GetUserInfoResponseDto,
  })
  @Get('me')
  async getMe(@Req() req: Request): Promise<GetUserInfoResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    const query: GetUserInfoQuery = {
      userId,
    };
    const result: GetUserInfoQueryResult =
      await this.userService.getUserInfo(query);

    return GetUserInfoResponseDto.buildFromQueryResult(result);
  }
}
