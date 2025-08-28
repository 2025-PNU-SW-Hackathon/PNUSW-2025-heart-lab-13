// 성과(Performance) API 타입 정의

export type PerformanceSourceType = 'GITHUB_PULL_REQUEST' | 'JIRA_ISSUE' | 'NOTION_PAGE'

export interface PerformanceReferenceRequest {
  sourceType: PerformanceSourceType
  sourceId: string
}

export interface PerformanceRequestBody {
  id?: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  description: string
  contribution: string
  outcome: string
  references: PerformanceReferenceRequest[]
}

export interface PerformanceReferenceResponse extends PerformanceReferenceRequest {
  id: string
  // 상세 응답에서만 내려올 수 있는 부가 데이터 (예: PR 상세)
  data?: import('../github/types').GithubPullDetail
}

export interface PerformanceResponseBody extends Omit<PerformanceRequestBody, 'references'> {
  references: PerformanceReferenceResponse[]
  createdAt: string // ISO-8601
  updatedAt: string // ISO-8601
}

export interface PerformanceListResponse {
  count: number //조회된 performance 시트 개수
  performances: PerformanceResponseBody[]
}

export type EvaluationJSON = {
  performanceId: string
  evaluation: {
    overallScore?: number
    technicalExcellence?: {
      score?: number
      details?: string
      keyStrengths?: string[]
      areasForImprovement?: string[]
    }
    impactAndValue?: {
      score?: number
      details?: string
      businessImpact?: string
      technicalImpact?: string
    }
    codeQuality?: {
      score?: number
      details?: string
      maintainability?: number
      readability?: number
      testCoverage?: string
    }
    collaboration?: {
      score?: number
      details?: string
      communicationQuality?: string
      teamwork?: string
    }
    summary?: string
    recommendations?: string[]
  }
}
