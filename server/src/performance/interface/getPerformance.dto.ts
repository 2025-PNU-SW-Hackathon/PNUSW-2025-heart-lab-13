import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
  REFERENCE_SOURCE_TYPE,
  ReferenceSourceType,
} from 'src/performance/model/reference.const';
import { GetPerformanceQueryResult } from 'src/performance/query/getPerformance.query';
import { GetPrDetailResponseDto } from 'src/tools/github/interface/getPrDetail.dto';

export type ReferenceData = GetPrDetailResponseDto;

@ApiExtraModels(GetPrDetailResponseDto)
export class GetPerformanceResponseReference {
  @ApiProperty({
    description: '레퍼런스 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '레퍼런스 출처 유형',
    enum: REFERENCE_SOURCE_TYPE,
  })
  sourceType: ReferenceSourceType;

  @ApiProperty({
    description: '레퍼런스 출처 ID',
    nullable: true,
    required: false,
    example: '/orgs/orgName/repos/pulls/123456',
  })
  sourceId: string;

  @ApiProperty({
    description: '레퍼런스 데이터',
    oneOf: [
      {
        $ref: getSchemaPath(GetPrDetailResponseDto),
      },
    ],
  })
  data: ReferenceData;
}

export class GetPerformanceResponseDto {
  @ApiProperty({
    description: '성과 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '성과 제목',
    example: '로그인 시스템 개선',
    nullable: true,
  })
  title: string | null;

  @ApiProperty({
    description: '성과 시작일',
    nullable: true,
    example: '2023-01-01',
  })
  startDate: Date | null;

  @ApiProperty({
    description: '성과 종료일',
    nullable: true,
    example: '2023-12-31',
  })
  endDate: Date | null;

  @ApiProperty({
    description: '성과 설명',
    nullable: true,
    example: '사용자 인증 방식을 OAuth2로 변경',
  })
  description: string | null;

  @ApiProperty({
    description: '성과 기여도',
    nullable: true,
    example: '사용자 인증 방식 개선에 기여',
  })
  contribution: string | null;

  @ApiProperty({
    description: '성과 결과',
    nullable: true,
    example: 'OAuth2로 변경하여 보안 강화',
  })
  outcome: string | null;

  @ApiProperty({
    description: '성과 레퍼런스',
    type: [GetPerformanceResponseReference],
  })
  references: GetPerformanceResponseReference[];

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;

  static buildFromQueryResult(
    result: GetPerformanceQueryResult,
  ): GetPerformanceResponseDto {
    const res = new GetPerformanceResponseDto();
    res.id = result.id;
    res.title = result.title;
    res.startDate = result.startDate;
    res.endDate = result.endDate;
    res.description = result.description;
    res.contribution = result.contribution;
    res.outcome = result.outcome;
    res.references = result.references.map((ref) => {
      const referenceRes = new GetPerformanceResponseReference();

      referenceRes.id = ref.id;
      referenceRes.sourceType = ref.sourceType;
      referenceRes.sourceId = ref.sourceId;

      if (ref.sourceType === REFERENCE_SOURCE_TYPE.GITHUB_PULL_REQUEST) {
        const data = GetPrDetailResponseDto.buildFromQueryResult(ref.data);
        referenceRes.data = data;
      }

      return referenceRes;
    });
    res.createdAt = result.createdAt;
    res.updatedAt = result.updatedAt;
    return res;
  }
}
