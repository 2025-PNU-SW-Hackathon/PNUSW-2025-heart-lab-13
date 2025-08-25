import { ApiProperty } from '@nestjs/swagger';
import { PR_STATE, PrState } from 'src/tools/github/dto/getGithubOrgPrs.dto';
import { GetPullRequestDetailQueryResult } from 'src/tools/github/query/getPrDetail.query';

export class GetPrDetailResponseAssignee {
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

export class GetPrDetailResponseLabel {
  @ApiProperty({
    description: 'PR 라벨 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'PR 라벨 이름',
    example: 'bug',
  })
  name: string;

  @ApiProperty({
    description: 'PR 라벨 설명',
    example: '버그 수정',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'PR 라벨 색상',
    example: 'f29513',
  })
  color: string;
}

export class GetPrDetailResponseBranch {
  @ApiProperty({
    description: 'PR 브랜치 레이블',
    example: 'moti-server:main',
  })
  label: string;

  @ApiProperty({
    description: 'PR 브랜치 이름',
    example: 'main',
  })
  ref: string;
}

export class GetPrDetailResponseDto {
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
    example: 'https://github.com/owner/repo/pull/67890',
  })
  url: string;

  @ApiProperty({
    description: 'PR 담당자 목록',
    type: [GetPrDetailResponseAssignee],
  })
  assignees: GetPrDetailResponseAssignee[];

  @ApiProperty({
    description: 'PR 라벨 목록',
    type: [GetPrDetailResponseLabel],
  })
  labels: GetPrDetailResponseLabel[];

  @ApiProperty({
    description: 'PR 병합할 브랜치 정보',
    type: GetPrDetailResponseBranch,
  })
  base: GetPrDetailResponseBranch;

  @ApiProperty({
    description: 'PR 작업한 브랜치 정보',
    type: GetPrDetailResponseBranch,
  })
  head: GetPrDetailResponseBranch;

  @ApiProperty({
    description: 'PR 병합한 사용자 정보',
    type: GetPrDetailResponseAssignee,
    nullable: true,
  })
  mergedBy: GetPrDetailResponseAssignee | null;

  @ApiProperty({
    description: 'reference 등록 시 사용되는 sourceId',
    example: '/repos/orgName/repoName/pulls/123',
  })
  sourceId: string;

  static buildFromQueryResult(
    result: GetPullRequestDetailQueryResult,
  ): GetPrDetailResponseDto {
    const dto = new GetPrDetailResponseDto();

    dto.id = result.id;
    dto.number = result.number;
    dto.title = result.title;
    dto.description = result.description;
    dto.createdAt = result.createdAt;
    dto.updatedAt = result.updatedAt;
    dto.mergedAt = result.mergedAt;
    dto.closedAt = result.closedAt;
    dto.state = result.state;
    dto.url = result.url;
    dto.sourceId = result.sourceId;

    dto.labels = result.labels.map((label) => {
      const labelDto = new GetPrDetailResponseLabel();

      labelDto.id = label.id;
      labelDto.name = label.name;
      labelDto.description = label.description;
      labelDto.color = label.color;

      return labelDto;
    });

    dto.assignees = result.assignees.map((assignee) => {
      const assigneeDto = new GetPrDetailResponseAssignee();

      assigneeDto.id = assignee.id;
      assigneeDto.name = assignee.name;
      assigneeDto.avatarUrl = assignee.avatarUrl;

      return assigneeDto;
    });

    const baseBranch = new GetPrDetailResponseBranch();
    baseBranch.label = result.base.label;
    baseBranch.ref = result.base.ref;
    dto.base = baseBranch;

    const headBranch = new GetPrDetailResponseBranch();
    headBranch.label = result.head.label;
    headBranch.ref = result.head.ref;
    dto.head = headBranch;

    if (result.mergedBy) {
      dto.mergedBy = new GetPrDetailResponseAssignee();

      dto.mergedBy.id = result.mergedBy.id;
      dto.mergedBy.name = result.mergedBy.name;
      dto.mergedBy.avatarUrl = result.mergedBy.avatarUrl;
    } else {
      dto.mergedBy = null;
    }

    return dto;
  }
}
