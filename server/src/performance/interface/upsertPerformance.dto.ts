import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpsertPerformanceCommandResult } from 'src/performance/command/upsertPerformance.command';
import {
  REFERENCE_SOURCE_TYPE,
  ReferenceSourceType,
} from 'src/performance/model/reference.const';

export class UpsertPerformanceRequestReference {
  @ApiProperty({
    description: '레퍼런스 출처 유형',
    enum: REFERENCE_SOURCE_TYPE,
  })
  @IsEnum(REFERENCE_SOURCE_TYPE)
  sourceType: ReferenceSourceType;

  @ApiProperty({
    description: '레퍼런스 출처 ID',
    nullable: true,
    required: false,
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  sourceId: string;
}

export class UpsertPerformanceRequestDto {
  @ApiProperty({
    description: '성과 ID (업데이트 시 사용)',
    nullable: true,
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  id: string | null = null;

  @ApiProperty({
    description: '성과 제목 (프로젝트명)',
    nullable: true,
    required: false,
    example: '로그인 시스템 개선',
  })
  @IsOptional()
  @IsString()
  title: string | null = null;

  @ApiProperty({
    description: '성과 시작일',
    nullable: true,
    required: false,
    example: '2023-01-01',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  startDate: Date | null = null;

  @ApiProperty({
    description: '성과 종료일',
    nullable: true,
    required: false,
    example: '2023-12-31',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  endDate: Date | null = null;

  @ApiProperty({
    description: '성과 설명',
    nullable: true,
    required: false,
    example: '사용자 인증 방식을 OAuth2로 변경',
  })
  @IsOptional()
  @IsString()
  description: string | null = null;

  @ApiProperty({
    description: '성과 기여도',
    nullable: true,
    required: false,
    example: '사용자 인증 방식 개선에 기여',
  })
  @IsOptional()
  @IsString()
  contribution: string | null = null;

  @ApiProperty({
    description: '성과 결과',
    nullable: true,
    required: false,
    example: 'OAuth2로 변경하여 보안 강화',
  })
  @IsOptional()
  @IsString()
  outcome: string | null = null;

  @ApiProperty({
    description: '성과 레퍼런스',
    type: [UpsertPerformanceRequestReference],
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertPerformanceRequestReference)
  references: UpsertPerformanceRequestReference[] = [];
}

export class UpsertPerformanceResponseReference {
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

export class UpsertPerformanceResponseDto {
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
    type: [UpsertPerformanceResponseReference],
  })
  references: UpsertPerformanceResponseReference[];

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;

  static buildFromCommandResult(
    result: UpsertPerformanceCommandResult,
  ): UpsertPerformanceResponseDto {
    const dto = new UpsertPerformanceResponseDto();
    dto.id = result.id;
    dto.title = result.title;
    dto.startDate = result.startDate;
    dto.endDate = result.endDate;
    dto.description = result.description;
    dto.contribution = result.contribution;
    dto.outcome = result.outcome;
    dto.references = result.references;
    dto.createdAt = result.createdAt;
    dto.updatedAt = result.updatedAt;
    return dto;
  }
}
