import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PR_STATE, PrState } from 'src/tools/github/dto/getGithubOrgPrs.dto';
import { GetOrganizationPullRequestsQueryResult } from 'src/tools/github/query/getOrgPrs.query';

export class GetOrganizationPrsRequestDto {
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsOptional()
  @IsDate()
  @ApiProperty({
    description: 'PR createdAt 조회 시작 날짜 (ISO 8601 형식)',
    example: '2023-01-01T00:00:00Z',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  startDate: Date | null = null;

  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsOptional()
  @IsDate()
  @ApiProperty({
    description: 'PR createdAt 조회 종료 날짜 (ISO 8601 형식)',
    example: '2023-01-31T23:59:59Z',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  endDate: Date | null = null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: '조회할 페이지 번호',
    example: 1,
    required: false,
    minimum: 1,
  })
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @ApiProperty({
    description: '한 페이지당 조회할 PR 개수',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 20,
  })
  limit: number = 10;
}

export class GetOrganizationPrsResponseAssignee {
  @ApiProperty({
    description: 'PR 담당자 ID',
    example: 12345,
  })
  id: number;

  @ApiProperty({
    description: 'PR 담당자 이름',
    example: 'rycando',
  })
  name: string;

  @ApiProperty({
    description: 'PR 담당자 아바타 URL',
    example: 'https://example.com/avatar.png',
  })
  avatarUrl: string;
}

export class GetOrganizationPrsResponsePr {
  @ApiProperty({
    description: 'PR ID',
    example: 67890,
  })
  id: number;

  @ApiProperty({
    description: 'PR 번호',
    example: 1,
  })
  number: number;

  @ApiProperty({
    description: 'PR 제목',
    example: 'feat: 로그인 구현',
  })
  title: string;

  @ApiProperty({
    description: 'PR 설명',
    example: '사용자 로그인 기능을 구현했습니다.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'PR 담당자 목록',
    type: [GetOrganizationPrsResponseAssignee],
  })
  assignees: GetOrganizationPrsResponseAssignee[];

  @ApiProperty({
    description: 'PR 생성 날짜 (ISO 8601 형식)',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'PR 업데이트 날짜 (ISO 8601 형식)',
    example: '2023-01-02T12:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'PR 병합 날짜 (ISO 8601 형식)',
    example: '2023-01-03T12:00:00Z',
    nullable: true,
  })
  mergedAt: Date | null;

  @ApiProperty({
    description: 'PR 닫힌 날짜 (ISO 8601 형식)',
    example: '2023-01-04T12:00:00Z',
    nullable: true,
  })
  closedAt: Date | null;

  @ApiProperty({
    description: 'PR 상태',
    enum: PR_STATE,
    example: PR_STATE.OPEN,
  })
  state: PrState;

  @ApiProperty({
    description: 'PR URL',
    example: 'https://github.com/owner/repo/pull/1',
  })
  url: string;

  @ApiProperty({
    description: 'PR 소스 ID',
    example: '/repos/owner/repo/pulls/1',
  })
  sourceId: string;
}

export class GetOrganizationPrsResponseDto {
  @ApiProperty({
    description: '필터에 해당하는 PR 총 개수',
    example: 100,
  })
  count: number;

  @ApiProperty({
    description: '조회된 PR 목록',
    type: [GetOrganizationPrsResponsePr],
  })
  prs: GetOrganizationPrsResponsePr[];

  static fromQueryResult(
    result: GetOrganizationPullRequestsQueryResult,
  ): GetOrganizationPrsResponseDto {
    const response = new GetOrganizationPrsResponseDto();

    response.count = result.count;
    response.prs = result.prs.map((pr) => {
      const prResponse = new GetOrganizationPrsResponsePr();

      prResponse.id = pr.id;
      prResponse.number = pr.number;
      prResponse.title = pr.title;
      prResponse.description = pr.description;
      prResponse.createdAt = pr.createdAt;
      prResponse.updatedAt = pr.updatedAt;
      prResponse.mergedAt = pr.mergedAt;
      prResponse.closedAt = pr.closedAt;
      prResponse.state = pr.state;
      prResponse.url = pr.url;
      prResponse.sourceId = pr.sourceId;
      prResponse.assignees = pr.assignees.map((assignee) => {
        const assigneeResponse = new GetOrganizationPrsResponseAssignee();

        assigneeResponse.id = assignee.id;
        assigneeResponse.name = assignee.name;
        assigneeResponse.avatarUrl = assignee.avatarUrl;

        return assigneeResponse;
      });

      return prResponse;
    });

    return response;
  }
}
