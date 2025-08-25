import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, Max, Min } from 'class-validator';
import {
  REFERENCE_SOURCE_TYPE,
  ReferenceSourceType,
} from 'src/performance/model/reference.const';
import { GetPerformancesQueryResult } from 'src/performance/query/getPerformances.query';

export class GetPerformancesRequestDto {
  @ApiProperty({
    description: '성과 조회 시작일',
    example: '2023-01-01T00:00:00.000Z',
    nullable: true,
    required: false,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startDate: Date | null = null;

  @ApiProperty({
    description: '성과 조회 종료일',
    example: '2023-12-31T23:59:59.999Z',
    nullable: true,
    required: false,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endDate: Date | null = null;

  @ApiProperty({
    description: '성과 조회 페이지',
    example: 1,
    minimum: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: '요청당 성과 조회 개수',
    example: 10,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  limit: number = 10;
}

export class GetPerformancesResponseReference {
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
    example: '123456',
  })
  sourceId: string;
}

export class GetPerformancesResponsePerformance {
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
    type: [GetPerformancesResponseReference],
  })
  references: GetPerformancesResponseReference[];

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;
}

export class GetPerformancesResponseDto {
  @ApiProperty({
    description: '성과 총 개수',
    example: 100,
  })
  count: number;

  @ApiProperty({
    description: '성과 리스트',
    type: [GetPerformancesResponsePerformance],
  })
  performances: GetPerformancesResponsePerformance[];

  static buildFromQueryResult(
    result: GetPerformancesQueryResult,
  ): GetPerformancesResponseDto {
    const res = new GetPerformancesResponseDto();

    res.count = result.count;
    res.performances = result.performances.map((performance) => {
      const performanceRes = new GetPerformancesResponsePerformance();

      performanceRes.id = performance.id;
      performanceRes.title = performance.title;
      performanceRes.startDate = performance.startDate;
      performanceRes.endDate = performance.endDate;
      performanceRes.description = performance.description;
      performanceRes.contribution = performance.contribution;
      performanceRes.outcome = performance.outcome;
      performanceRes.references = performance.references.map((ref) => {
        const referenceRes = new GetPerformancesResponseReference();

        referenceRes.id = ref.id;
        referenceRes.sourceType = ref.sourceType;
        referenceRes.sourceId = ref.sourceId;

        return referenceRes;
      });
      performanceRes.createdAt = performance.createdAt;
      performanceRes.updatedAt = performance.updatedAt;

      return performanceRes;
    });

    return res;
  }
}
