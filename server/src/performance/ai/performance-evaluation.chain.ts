import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ConfigService } from '@nestjs/config';

import { PerformanceEvaluationResult } from 'src/performance/interface/evaluatePerformance.dto';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Performance } from 'src/performance/model/performance.entity';
import { PerformanceReference } from 'src/performance/model/performanceReference.entity';
import { McpClient } from 'src/tools/mcp/mcp.client';

interface MCPTool {
  name: string;
  description: string;
  invoke: (params: Record<string, unknown>) => unknown;
}

// REST response interfaces removed; MCP-only integration is used

interface ReferenceAnalysisItem {
  type: string;
  sourceId: string;
  createdAt: Date;
  prParams?: {
    owner: string;
    repo: string;
    pullNumber: number;
  };
  prData?: unknown;
  error?: string;
}

interface EvaluationData {
  technicalExcellence: {
    score: number;
    details: string;
    keyStrengths: string[];
    areasForImprovement: string[];
  };
  impactAndValue: {
    score: number;
    details: string;
    businessImpact: string;
    technicalImpact: string;
  };
  codeQuality: {
    score: number;
    details: string;
    maintainability: number;
    readability: number;
    testCoverage: string;
  };
  collaboration: {
    score: number;
    details: string;
    communicationQuality: string;
    teamwork: string;
  };
}

interface ReportData {
  overallScore: number;
  summary: string;
  recommendations: string[];
}

@Injectable()
export class PerformanceEvaluationChain {
  private analysisModel: ChatAnthropic;
  private evaluationModel: ChatOpenAI;
  private reportModel: ChatOpenAI;
  private mcpToolsCache: MCPTool[] = [];

  constructor(private readonly configService: ConfigService) {
    this.analysisModel = new ChatAnthropic({
      model:
        this.configService.get<string>('ai.analysisModel') ||
        'claude-3-5-sonnet-20241022',
      apiKey: this.configService.get<string>('ai.anthropicApiKey') || '',
      temperature: 0.1,
    });

    // o1-mini는 temperature를 지원하지 않음
    const evaluationModel =
      this.configService.get<string>('ai.evaluationModel') || 'o1-mini';
    this.evaluationModel = new ChatOpenAI({
      model: evaluationModel,
      apiKey: this.configService.get<string>('ai.openaiApiKey') || '',
      ...(evaluationModel.startsWith('o1') ? {} : { temperature: 0.2 }),
    });

    this.reportModel = new ChatOpenAI({
      model: this.configService.get<string>('ai.reportModel') || 'gpt-4o',
      apiKey: this.configService.get<string>('ai.openaiApiKey') || '',
      temperature: 0.2, // GPT-4o에 최적화된 설정
    });

    // MCP/GitHub tools are initialized lazily at call time with injected options
  }

  // Prepare GitHub tools strictly via MCP (no REST fallback)
  private async getGitHubTools(params: {
    githubCredential: string;
  }): Promise<MCPTool[]> {
    const { githubCredential } = params;

    if (this.mcpToolsCache.length > 0) return this.mcpToolsCache;

    // Get MCP configuration from config service
    const mcpMode = 'url';

    const mcpUrl = this.configService.get<string>('ai.githubMcpUrl');
    const githubToken = githubCredential;

    if (!mcpUrl) {
      throw new Error(
        'GitHub MCP configuration is required (either command or URL)',
      );
    }

    const client = new McpClient();
    await client.init({
      mode: mcpMode,
      serverName: 'github',
      env: { GITHUB_TOKEN: githubToken },
      url: mcpUrl,
    });

    const tools = client.listTools();
    if (!tools?.length) {
      throw new Error('No tools loaded from GitHub MCP server');
    }

    this.mcpToolsCache = tools.map((t) => ({
      name: t.name,
      description: t.description || '',
      invoke: (params: Record<string, unknown>) => t.invoke(params),
    }));
    return this.mcpToolsCache;
  }

  async evaluatePerformance(params: {
    performance: Performance;
    references: PerformanceReference[];
    githubCredential: string;
  }): Promise<PerformanceEvaluationResult> {
    const { performance, references, githubCredential } = params;

    // 1단계: 데이터 분석 (Claude 사용, GitHub MCP diff 정보 포함)
    const analysisResult = await this.analyzeReferenceData(
      performance,
      references,
      githubCredential,
    );

    // 2단계: 성과 평가 (o1-mini 사용)
    const evaluationResult = await this.evaluatePerformanceData({
      performance,
      analysisResult,
      references,
    });

    // 3단계: 리포트 생성 (GPT-4 사용)
    const finalReport = await this.generateEvaluationReport({
      performance,
      evaluationResult,
      analysisResult,
    });

    return finalReport;
  }

  private async analyzeReferenceData(
    performance: Performance,
    references: PerformanceReference[],
    githubCredential: string,
  ): Promise<string> {
    // MCP 도구를 준비
    const mcpTools: MCPTool[] = await this.getGitHubTools({ githubCredential });
    const referenceAnalysis: ReferenceAnalysisItem[] = [];

    for (const reference of references) {
      try {
        // GitHub PR인 경우 MCP 도구를 사용하여 diff 정보를 가져옴
        if (
          reference.sourceType === 'GITHUB_PULL_REQUEST' &&
          reference.sourceId
        ) {
          const prParams = this.parsePullRequestUrl(reference.sourceId);
          if (prParams && mcpTools.length > 0) {
            // MCP 도구를 사용하여 GitHub PR 정보 수집
            let prData: unknown = null;

            try {
              // GitHub MCP 도구 중에서 get_pull_request_diff 도구 사용
              const githubTool = mcpTools.find(
                (tool) => tool.name === 'get_pull_request_diff',
              );

              if (githubTool) {
                // MCP 도구를 통해 PR 정보 가져오기 (비동기 호출)
                prData = await (githubTool.invoke({
                  owner: prParams.owner,
                  repo: prParams.repo,
                  pull_number: prParams.pullNumber,
                }) as Promise<unknown>);
              } else {
                throw new Error(
                  'MCP tool get_pull_request_diff not found in GitHub server',
                );
              }
            } catch (mcpError) {
              console.error('MCP tool error:', mcpError);
            }

            referenceAnalysis.push({
              type: 'GitHub PR with MCP Data',
              sourceId: reference.sourceId,
              prParams: prParams,
              prData: prData,
              createdAt: reference.createdAt,
            });
          } else {
            // MCP 도구가 없거나 URL 파싱 실패시 기본 정보만 포함
            referenceAnalysis.push({
              type: 'GitHub PR (Basic)',
              sourceId: reference.sourceId,
              createdAt: reference.createdAt,
            });
          }
        } else {
          // 다른 타입의 reference는 기본 정보만 포함
          referenceAnalysis.push({
            type: reference.sourceType,
            sourceId: reference.sourceId,
            createdAt: reference.createdAt,
          });
        }
      } catch (error) {
        // 개별 reference 처리 실패시 기본 정보만 포함
        referenceAnalysis.push({
          type: reference.sourceType,
          sourceId: reference.sourceId,
          error: `Failed to fetch additional data: ${(error as Error)?.message || 'Unknown error'}`,
          createdAt: reference.createdAt,
        });
      }
    }

    const analysisPrompt = ChatPromptTemplate.fromTemplate(`
당신은 소프트웨어 개발 성과를 분석하는 전문가입니다.
다음 GitHub Pull Request 데이터와 diff 정보를 분석하여 기술적 품질, 영향도, 협업 상태를 평가해주세요.

Performance Context:
- Title: {performanceTitle}
- Description: {performanceDescription}
- Period: {startDate} ~ {endDate}

Reference Data with Diff Analysis:
{referenceData}

다음 관점에서 세밀하게 분석해주세요:
1. **코드 변경의 복잡도와 품질**
   - Diff 정보를 바탕으로 한 코드 변경의 규모와 복잡성
   - 코드 구조 개선 정도 및 기술적 난이도
   - 아키텍처 변경 사항 및 설계 패턴 활용

2. **비즈니스 임팩트와 기술적 기여도**
   - 기능 추가/개선의 비즈니스 가치
   - 성능 최적화 및 사용자 경험 개선
   - 기술 부채 해결 및 유지보수성 향상

3. **코드 리뷰 과정과 협업 품질**
   - PR 설명의 명확성과 상세도
   - 코드 리뷰 참여도 및 피드백 반영
   - 팀 내 지식 공유 및 멘토링

4. **테스트 커버리지와 유지보수성**
   - 테스트 코드 추가/개선 여부
   - 코드 가독성 및 문서화 수준
   - 에러 처리 및 예외 상황 대응

5. **커뮤니케이션과 문서화 품질**
   - 커밋 메시지의 명확성
   - PR 설명 및 관련 문서 업데이트
   - 이슈 해결 과정의 투명성

각 항목에 대해 diff 정보와 PR 데이터를 근거로 구체적이고 정량적인 분석을 제공해주세요.
`);

    const chain = RunnableSequence.from([
      analysisPrompt,
      this.analysisModel,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      performanceTitle: performance.title || 'N/A',
      performanceDescription: performance.description || 'N/A',
      startDate: performance.startDate?.toISOString() || 'N/A',
      endDate: performance.endDate?.toISOString() || 'N/A',
      referenceData: JSON.stringify(referenceAnalysis, null, 2),
    });

    return result;
  }

  private parsePullRequestUrl(sourceId: string): {
    owner: string;
    repo: string;
    pullNumber: number;
  } | null {
    try {
      // GitHub PR URL 형식: https://github.com/owner/repo/pull/123
      const url = new URL(sourceId);
      const pathParts = url.pathname.split('/');

      if (pathParts.length >= 5 && pathParts[3] === 'pull') {
        return {
          owner: pathParts[1],
          repo: pathParts[2],
          pullNumber: parseInt(pathParts[4], 10),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async evaluatePerformanceData(params: {
    performance: Performance;
    analysisResult: string;
    references: PerformanceReference[];
  }): Promise<EvaluationData> {
    const { performance, analysisResult } = params;

    const evaluationPrompt = ChatPromptTemplate.fromTemplate(`
당신은 성과 평가 전문가입니다. 다음 정보를 바탕으로 개발자의 성과를 정량적으로 평가해주세요.

Performance Information:
- Title: {title}
- Description: {description}
- Contribution: {contribution}
- Outcome: {outcome}
- Period: {startDate} ~ {endDate}

Analysis Result:
{analysisResult}

다음 JSON 형식으로 평가 결과를 반환해주세요 (JSON만 반환, 다른 텍스트 없이):
{{
  "technicalExcellence": {{
    "score": <1-10 숫자>,
    "details": "<상세 설명>",
    "keyStrengths": ["<강점1>", "<강점2>"],
    "areasForImprovement": ["<개선점1>", "<개선점2>"]
  }},
  "impactAndValue": {{
    "score": <1-10 숫자>,
    "details": "<상세 설명>",
    "businessImpact": "<비즈니스 임팩트>",
    "technicalImpact": "<기술적 임팩트>"
  }},
  "codeQuality": {{
    "score": <1-10 숫자>,
    "details": "<상세 설명>",
    "maintainability": <1-10 숫자>,
    "readability": <1-10 숫자>,
    "testCoverage": "<테스트 커버리지 평가>"
  }},
  "collaboration": {{
    "score": <1-10 숫자>,
    "details": "<상세 설명>",
    "communicationQuality": "<커뮤니케이션 품질>",
    "teamwork": "<팀워크 평가>"
  }}
}}
`);

    const chain = RunnableSequence.from([
      evaluationPrompt,
      this.evaluationModel,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      title: performance.title || 'N/A',
      description: performance.description || 'N/A',
      contribution: performance.contribution || 'N/A',
      outcome: performance.outcome || 'N/A',
      startDate: performance.startDate?.toISOString() || 'N/A',
      endDate: performance.endDate?.toISOString() || 'N/A',
      analysisResult,
    });

    const parsedResult = result.split('```json')[1].split('```')[0];

    return JSON.parse(parsedResult) as EvaluationData;
  }

  private async generateEvaluationReport(params: {
    performance: Performance;
    evaluationResult: EvaluationData;
    analysisResult: string;
  }): Promise<PerformanceEvaluationResult> {
    const { performance, evaluationResult } = params;

    const reportPrompt = ChatPromptTemplate.fromTemplate(`
다음 평가 결과를 바탕으로 종합적인 성과 평가 요약과 추천사항을 작성해주세요.

Evaluation Result:
{evaluationResult}

다음 JSON 형식으로 반환해주세요 (JSON만 반환):
{{
  "overallScore": <1-10 평균 점수>,
  "summary": "<전체적인 성과 요약 (200자 내외)>",
  "recommendations": ["<추천사항1>", "<추천사항2>", "<추천사항3>"]
}}
`);

    const chain = RunnableSequence.from([
      reportPrompt,
      this.reportModel,
      new StringOutputParser(),
    ]);

    const reportResult = await chain.invoke({
      evaluationResult: JSON.stringify(evaluationResult, null, 2),
    });

    const parsedReport = reportResult.split('```json')[1].split('```')[0];

    const report = JSON.parse(parsedReport) as ReportData;

    return {
      performanceId: performance.id,
      overallScore: report.overallScore,
      technicalExcellence: evaluationResult.technicalExcellence,
      impactAndValue: evaluationResult.impactAndValue,
      codeQuality: evaluationResult.codeQuality,
      collaboration: evaluationResult.collaboration,
      summary: report.summary,
      recommendations: report.recommendations,
      evaluatedAt: new Date(),
      evaluationModel: `${this.configService.get<string>('ai.analysisModel') || 'claude-3-5-sonnet-20241022'}+${this.configService.get<string>('ai.evaluationModel') || 'o1-mini'}+${this.configService.get<string>('ai.reportModel') || 'gpt-4o'}`,
    };
  }
}
