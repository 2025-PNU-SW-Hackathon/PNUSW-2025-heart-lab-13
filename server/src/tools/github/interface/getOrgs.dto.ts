import { ApiProperty } from '@nestjs/swagger';
import { GetOrganizationsQueryResult } from 'src/tools/github/query/getOrg.query';

class GetGithubOrgsResponseOrg {
  @ApiProperty({
    description: '조직 이름',
    example: 'example-org',
  })
  name: string;

  @ApiProperty({
    description: '조직의 아바타 URL',
    example: 'https://example.com/avatar.png',
  })
  avatarUrl: string;
}

export class GetGithubOrgsResponseDto {
  @ApiProperty({
    description: '조직의 총 개수',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: '조직 목록',
    type: [GetGithubOrgsResponseOrg],
  })
  orgs: GetGithubOrgsResponseOrg[];

  static fromQueryResult(
    result: GetOrganizationsQueryResult,
  ): GetGithubOrgsResponseDto {
    const response = new GetGithubOrgsResponseDto();

    response.count = result.count;
    response.orgs = result.orgs.map((org) => {
      const orgResponse = new GetGithubOrgsResponseOrg();

      orgResponse.name = org.login;
      orgResponse.avatarUrl = org.avatarUrl;

      return orgResponse;
    });

    return response;
  }
}
