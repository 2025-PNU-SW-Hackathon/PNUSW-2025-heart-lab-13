import { ApiProperty } from '@nestjs/swagger';

export class EvaluatePerformanceQuery {
  @ApiProperty({
    description: '사용자 ID',
    example: 'user_123456',
  })
  userId: string;

  @ApiProperty({
    description: '평가할 성과의 ID',
    example: 'perf_123456',
  })
  performanceId: string;
}

class TechnicalExcellenceDto {
  @ApiProperty({
    description: '기술적 우수성 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 8,
  })
  score: number;

  @ApiProperty({
    description: '기술적 우수성 상세 설명',
    example: '코드 구조가 잘 설계되어 있고 성능 최적화가 잘 되어 있음',
  })
  details: string;

  @ApiProperty({
    description: '주요 강점들',
    type: [String],
    example: ['클린 코드 작성', '효율적인 알고리즘 사용'],
  })
  keyStrengths: string[];

  @ApiProperty({
    description: '개선이 필요한 영역들',
    type: [String],
    example: ['예외 처리 강화', '주석 추가'],
  })
  areasForImprovement: string[];
}

class ImpactAndValueDto {
  @ApiProperty({
    description: '영향력과 가치 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 7,
  })
  score: number;

  @ApiProperty({
    description: '영향력과 가치 상세 설명',
    example: '비즈니스 목표 달성에 크게 기여함',
  })
  details: string;

  @ApiProperty({
    description: '비즈니스 임팩트',
    example: '사용자 경험 개선으로 만족도 15% 향상',
  })
  businessImpact: string;

  @ApiProperty({
    description: '기술적 임팩트',
    example: '시스템 성능 20% 개선',
  })
  technicalImpact: string;
}

class CodeQualityDto {
  @ApiProperty({
    description: '코드 품질 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 8,
  })
  score: number;

  @ApiProperty({
    description: '코드 품질 상세 설명',
    example: '높은 수준의 코드 품질을 유지하고 있음',
  })
  details: string;

  @ApiProperty({
    description: '유지보수성 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 8,
  })
  maintainability: number;

  @ApiProperty({
    description: '가독성 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 9,
  })
  readability: number;

  @ApiProperty({
    description: '테스트 커버리지 설명',
    example: '90% 이상의 높은 테스트 커버리지 달성',
  })
  testCoverage: string;
}

class CollaborationDto {
  @ApiProperty({
    description: '협업 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 9,
  })
  score: number;

  @ApiProperty({
    description: '협업 상세 설명',
    example: '팀원들과의 원활한 협업을 통해 프로젝트를 성공적으로 완료',
  })
  details: string;

  @ApiProperty({
    description: '의사소통 품질',
    example: '명확하고 효과적인 의사소통',
  })
  communicationQuality: string;

  @ApiProperty({
    description: '팀워크',
    example: '팀 목표 달성에 적극적으로 기여',
  })
  teamwork: string;
}

export class PerformanceEvaluationResult {
  @ApiProperty({
    description: '평가된 성과의 ID',
    example: 'perf_123456',
  })
  performanceId: string;

  @ApiProperty({
    description: '전체 점수 (1-10)',
    minimum: 1,
    maximum: 10,
    example: 8.2,
  })
  overallScore: number;

  @ApiProperty({
    description: '기술적 우수성 평가',
    type: TechnicalExcellenceDto,
  })
  technicalExcellence: TechnicalExcellenceDto;

  @ApiProperty({
    description: '영향력과 가치 평가',
    type: ImpactAndValueDto,
  })
  impactAndValue: ImpactAndValueDto;

  @ApiProperty({
    description: '코드 품질 평가',
    type: CodeQualityDto,
  })
  codeQuality: CodeQualityDto;

  @ApiProperty({
    description: '협업 평가',
    type: CollaborationDto,
  })
  collaboration: CollaborationDto;

  @ApiProperty({
    description: '평가 요약',
    example:
      '전반적으로 우수한 성과를 보여주었으며, 특히 기술적 역량과 협업 능력이 뛰어남',
  })
  summary: string;

  @ApiProperty({
    description: '개선 권장사항',
    type: [String],
    example: ['문서화 개선', '코드 리뷰 프로세스 강화', '테스트 자동화 확대'],
  })
  recommendations: string[];

  @ApiProperty({
    description: '평가 완료 시간',
    type: Date,
    example: '2025-08-28T14:30:00.000Z',
  })
  evaluatedAt: Date;

  @ApiProperty({
    description: '평가에 사용된 AI 모델',
    example: 'Claude-3.5-Sonnet + o1-mini + GPT-4o',
  })
  evaluationModel: string;
}

export class EvaluatePerformanceResponseDto {
  @ApiProperty({
    description: '평가된 성과의 ID',
    example: 'perf_123456',
  })
  performanceId: string;

  @ApiProperty({
    description: '성과 평가 결과',
    type: PerformanceEvaluationResult,
  })
  evaluation: PerformanceEvaluationResult;

  constructor(params: {
    performanceId: string;
    evaluation: PerformanceEvaluationResult;
  }) {
    this.performanceId = params.performanceId;
    this.evaluation = params.evaluation;
  }
}
