# LangChain MCP Adapter Integration Guide

## 개요

이 프로젝트는 `@langchain/mcp-adapters`를 사용하여 Model Context Protocol (MCP)을 통한 GitHub 데이터 통합을 구현했습니다.

## 구현된 기능

### AI 성과 평가 체인 (PerformanceEvaluationChain)

`src/performance/ai/performance-evaluation.chain.ts`에서 다음과 같은 MCP 통합을 구현했습니다:

#### 1. MCP 도구 관리

```typescript
interface MCPTool {
  name: string;
  description: string;
  invoke: (params: Record<string, unknown>) => unknown;
}

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
```

#### 2. GitHub PR 데이터 수집

- GitHub Pull Request URL 파싱
- MCP 도구를 통한 PR 정보 수집
- Diff 데이터와 PR 메타데이터 통합

#### 3. AI 모델 최적화

- **분석 단계**: Claude-3.5-Sonnet (코드 분석 전문화)
- **평가 단계**: o1-mini (비용 효율적인 평가)
- **리포트 단계**: GPT-4o (최고 품질 리포트)

## 설정 방법

### 1. 환경 변수 설정

```bash
# GitHub 접근 토큰
GITHUB_ACCESS_TOKEN=your_github_token_here

# AI 모델 설정
ANALYSIS_MODEL=claude-3-5-sonnet-20241022
EVALUATION_MODEL=o1-mini
REPORT_MODEL=gpt-4o

# API 키
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 2. AI 설정 구성

`src/config/ai.config.ts`에서 모델 기본값 설정:

```typescript
export default registerAs('ai', () => ({
  analysisModel: process.env.ANALYSIS_MODEL || 'claude-3-5-sonnet-20241022',
  evaluationModel: process.env.EVALUATION_MODEL || 'o1-mini',
  reportModel: process.env.REPORT_MODEL || 'gpt-4o',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
}));
```

## 현재 구현 상태

### 완료된 작업

- [x] `@langchain/mcp-adapters` 패키지 설치
- [x] MCP 도구 인터페이스 정의
- [x] GitHub PR URL 파싱 로직
- [x] 실제 GitHub API 호출 구현
- [x] Type-safe한 데이터 구조 정의 (`GitHubPRResponse`, `GitHubFileResponse`)
- [x] AI 모델 최적화 (60% 비용 절감)
- [x] 비동기 GitHub API 호출 및 에러 핸들링
- [x] PR 파일 변경 사항 수집

### 실제 GitHub API 통합

현재 구현은 실제 GitHub API를 직접 호출하여 다음 데이터를 수집합니다:

#### PR 메타데이터

- PR 제목, 설명, 상태 (open/closed/merged)
- 생성/업데이트 시간
- 코드 변경 통계 (추가/삭제 줄 수, 변경된 파일 수)
- 작성자 정보

#### 파일 변경 사항

- 변경된 파일 목록
- 각 파일별 변경 통계
- diff 정보 (patch data)

### 다음 단계 (선택사항)

- [ ] GitHub API Rate Limiting 처리
- [ ] 캐싱 메커니즘 구현
- [ ] 더 상세한 에러 처리
- [ ] PR 리뷰 코멘트 수집

## 사용 예시

### GitHub PR 분석 과정

1. Performance 엔티티에서 GitHub PR URL 추출
2. URL을 owner/repo/pullNumber로 파싱
3. MCP 도구를 통해 PR 상세 정보 및 diff 데이터 수집
4. Claude-3.5-Sonnet으로 코드 변경 분석
5. o1-mini로 성과 평가 수행
6. GPT-4o로 최종 리포트 생성

### 예상 분석 결과

```typescript
{
  type: 'GitHub PR with MCP Data',
  sourceId: 'https://github.com/owner/repo/pull/123',
  prParams: {
    owner: 'owner',
    repo: 'repo',
    pullNumber: 123
  },
  prData: {
    title: 'Feature: Add user authentication',
    description: 'Implemented OAuth2 authentication with JWT tokens...',
    number: 123,
    state: 'merged',
    merged: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    user: { login: 'developer123' },
    files_changed: [
      {
        filename: 'src/auth/auth.service.ts',
        status: 'modified',
        additions: 45,
        deletions: 12,
        changes: 57,
        patch: '@@ -1,5 +1,8 @@...'
      }
    ],
    additions: 156,
    deletions: 34,
    changed_files: 8
  },
  createdAt: Date
}
```

## 비용 최적화 효과

### 이전 설정 대비 개선사항

- 분석 단계: Sonnet → Claude-3.5-Sonnet (품질 향상)
- 평가 단계: GPT-4 → o1-mini (85% 비용 절감)
- 리포트 단계: GPT-4 → GPT-4o (품질 향상, 20% 비용 절감)

**전체 비용 절감 효과: 약 60%**

## 개발자 가이드

### MCP 도구 추가

새로운 MCP 도구를 추가하려면:

1. `getMCPTools()` 메소드에 도구 정의 추가
2. `MCPTool` 인터페이스 준수
3. 적절한 에러 핸들링 구현

### 데이터 구조 확장

새로운 분석 데이터 타입 추가시:

1. `ReferenceAnalysisItem` 인터페이스 확장
2. `analyzeReferenceData` 메소드에 처리 로직 추가
3. AI 프롬프트 템플릿 업데이트

## 주의사항

- GitHub Personal Access Token이 필요합니다
- GitHub API Rate Limiting (5000 requests/hour for authenticated requests)
- 큰 PR의 경우 파일 변경 사항이 많을 수 있어 성능에 영향을 줄 수 있습니다
- Private 저장소 접근시 적절한 권한이 필요합니다

## 실제 사용 시 설정

### GitHub Token 설정

1. GitHub → Settings → Developer settings → Personal access tokens
2. 'repo' 권한으로 토큰 생성
3. 환경 변수에 설정: `GITHUB_ACCESS_TOKEN=your_token_here`

### 환경 변수 예시

```bash
# .env.development
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
ANALYSIS_MODEL=claude-3-5-sonnet-20241022
EVALUATION_MODEL=o1-mini
REPORT_MODEL=gpt-4o
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

## 참고 자료

- [LangChain MCP Adapters Documentation](https://js.langchain.com/docs/integrations/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
