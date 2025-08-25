import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUserDto } from 'src/auth/dto/authUser.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GithubService } from 'src/tools/github/github.service';
import {
  GetOrganizationPrsRequestDto,
  GetOrganizationPrsResponseDto,
} from 'src/tools/github/interface/getOrgPrs.dto';
import { GetGithubOrgsResponseDto } from 'src/tools/github/interface/getOrgs.dto';
import { GetPrDetailResponseDto } from 'src/tools/github/interface/getPrDetail.dto';
import {
  GetOrganizationsQueryResult,
  GetOrganizationsQuery,
} from 'src/tools/github/query/getOrg.query';
import {
  GetOrganizationPullRequestsQuery,
  GetOrganizationPullRequestsQueryResult,
} from 'src/tools/github/query/getOrgPrs.query';
import {
  GetPullRequestDetailQuery,
  GetPullRequestDetailQueryResult,
} from 'src/tools/github/query/getPrDetail.query';

@ApiTags('/tools/github')
@Controller('tools/github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'GitHub 조직 목록 조회',
    description: '사용자의 GitHub 조직 목록을 조회합니다.',
  })
  @ApiOkResponse({
    description: '조직 목록 조회 성공',
    type: GetGithubOrgsResponseDto,
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @Get('/orgs')
  async getOrganizations(
    @Req() req: Request,
  ): Promise<GetGithubOrgsResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    const query: GetOrganizationsQuery = {
      userId,
    };
    const result: GetOrganizationsQueryResult =
      await this.githubService.getOrganizations(query);

    return GetGithubOrgsResponseDto.fromQueryResult(result);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'GitHub 조직의 Pull Requests 조회',
    description: '특정 조직의 Pull Requests를 조회합니다.',
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @ApiParam({
    name: 'orgName',
    description: '조직 이름',
    type: String,
  })
  @ApiOkResponse({
    description: '조직의 Pull Requests 조회 성공',
    type: GetOrganizationPrsResponseDto,
  })
  @Get('/orgs/:orgName/pulls')
  async getOrganizationPullRequests(
    @Req() req: Request,
    @Param('orgName') orgName: string,
    @Query() dto: GetOrganizationPrsRequestDto,
  ): Promise<GetOrganizationPrsResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    const { startDate, endDate, page, limit } = dto;

    const query: GetOrganizationPullRequestsQuery = {
      userId,
      orgName,
      startDate,
      endDate,
      page,
      limit,
    };
    const result: GetOrganizationPullRequestsQueryResult =
      await this.githubService.getOrganizationPullRequests(query);

    return GetOrganizationPrsResponseDto.fromQueryResult(result);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'GitHub 조직의 Pull Request 상세 조회',
    description: '특정 조직의 Pull Request를 상세 조회합니다.',
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @ApiParam({
    name: 'orgName',
    description: '조직 이름',
    type: String,
  })
  @ApiParam({
    name: 'repoName',
    description: '저장소 이름',
    type: String,
  })
  @ApiParam({
    name: 'prNumber',
    description: 'Pull Request 번호',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Pull Request 상세 조회 성공',
    type: GetPrDetailResponseDto,
  })
  @Get('/repos/:orgName/:repoName/pulls/:prNumber')
  async getOrganizationPullRequestById(
    @Req() req: Request,
    @Param('orgName') orgName: string,
    @Param('repoName') repoName: string,
    @Param('prNumber') prNumber: string,
  ): Promise<GetPrDetailResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    const query: GetPullRequestDetailQuery = {
      userId,
      orgName,
      repoName,
      prNumber: Number(prNumber),
    };
    const result: GetPullRequestDetailQueryResult =
      await this.githubService.getPrDetail(query);

    return GetPrDetailResponseDto.buildFromQueryResult(result);
  }
}
