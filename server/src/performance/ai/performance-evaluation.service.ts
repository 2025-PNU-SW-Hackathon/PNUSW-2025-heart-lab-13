import { Injectable, NotFoundException } from '@nestjs/common';
import { PerformanceEvaluationChain } from 'src/performance/ai/performance-evaluation.chain';
import { Performance } from 'src/performance/model/performance.entity';
import {
  EvaluatePerformanceQuery,
  PerformanceEvaluationResult,
} from 'src/performance/interface/evaluatePerformance.dto';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ToolCredential } from 'src/user/model/toolCredential.entity';
import { TOOL_TYPE } from 'src/user/model/toolType.const';

@Injectable()
export class PerformanceEvaluationService {
  constructor(
    private readonly evaluationChain: PerformanceEvaluationChain,
    @InjectRepository(Performance)
    private readonly performanceRepository: Repository<Performance>,
    @InjectRepository(ToolCredential)
    private readonly toolCredentialRepository: Repository<ToolCredential>,
  ) {}

  async evaluatePerformance(
    query: EvaluatePerformanceQuery,
  ): Promise<PerformanceEvaluationResult> {
    const { userId, performanceId } = query;

    // 1. Performance 데이터 조회
    const performanceData = await this.performanceRepository.findOne({
      where: { id: performanceId, deletedAt: IsNull() },
      relations: ['user', 'references'],
    });

    if (!performanceData) {
      throw new NotFoundException(ExceptionMessage.PERFORMANCE_NOT_FOUND);
    }

    const credential = await this.toolCredentialRepository.findOne({
      where: {
        user: { id: userId },
        toolType: TOOL_TYPE.GITHUB,
      },
    });

    if (!credential) {
      throw new NotFoundException(ExceptionMessage.GITHUB_IS_NOT_CONNECTED);
    }

    // 2. AI 평가 체인 실행
    const evaluationResult = await this.evaluationChain.evaluatePerformance({
      performance: performanceData,
      references: performanceData.references,
      githubCredential: credential.accessToken,
    });

    return evaluationResult;
  }
}
