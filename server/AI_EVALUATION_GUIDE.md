# AI Performance Evaluation Agent

## 개요

이 AI 평가 agent는 개발자의 성과(Performance)를 AI가 종합적으로 분석하고 평가하는 시스템입니다. GitHub Pull Request 데이터를 기반으로 기술적 우수성, 임팩트, 코드 품질, 협업 능력을 정량적으로 평가합니다.

## 아키텍처

### 1. 단계별 AI 모델 활용

- **분석 단계 (Claude-3.5-Sonnet)**: GitHub PR 데이터 상세 분석
- **평가 단계 (o1-mini)**: 정량적 성과 평가 및 점수 산정 (일관성과 체계성 최적화)
- **리포트 생성 (GPT-4o)**: 종합 요약 및 개선 추천사항 작성 (비용 효율성 개선)

### 2. 핵심 컴포넌트

```
PerformanceController
├── PerformanceEvaluationService
├── PerformanceEvaluationChain (LangChain)
├── ReferenceBuilder (GitHub MCP)
└── AiConfig
```

## API 엔드포인트

### POST /performances/:id/evaluate

개별 성과에 대한 AI 평가를 수행합니다.

**Request:**

```bash
curl -X POST "http://localhost:3000/performances/{performanceId}/evaluate" \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "performanceId": "performance-uuid",
  "evaluation": {
    "overallScore": 8.2,
    "technicalExcellence": {
      "score": 9,
      "details": "높은 수준의 기술적 구현과 아키텍처 설계를 보여줍니다.",
      "keyStrengths": [
        "복잡한 알고리즘의 효율적 구현",
        "확장 가능한 아키텍처 설계"
      ],
      "areasForImprovement": ["에러 핸들링 개선", "코드 문서화 강화"]
    },
    "impactAndValue": {
      "score": 8,
      "details": "비즈니스 가치와 기술적 기여도가 우수합니다.",
      "businessImpact": "사용자 경험 개선으로 전환율 15% 향상 기여",
      "technicalImpact": "시스템 성능 30% 개선 및 안정성 향상"
    },
    "codeQuality": {
      "score": 7,
      "details": "전반적으로 양호한 코드 품질을 보입니다.",
      "maintainability": 7,
      "readability": 8,
      "testCoverage": "80% 이상의 테스트 커버리지 확보"
    },
    "collaboration": {
      "score": 9,
      "details": "우수한 협업 능력과 커뮤니케이션을 보여줍니다.",
      "communicationQuality": "명확하고 건설적인 PR 리뷰 참여",
      "teamwork": "팀원들과의 활발한 지식 공유"
    },
    "summary": "전반적으로 우수한 성과를 보이며, 특히 기술적 우수성과 팀워크 측면에서 뛰어난 능력을 발휘했습니다.",
    "recommendations": [
      "에러 핸들링 패턴을 일관성 있게 적용하세요",
      "코드 문서화를 통해 유지보수성을 높이세요",
      "단위 테스트 커버리지를 90% 이상으로 향상시키세요"
    ],
    "evaluatedAt": "2025-01-27T12:00:00Z",
    "evaluationModel": "claude-3-5-sonnet-20241022+gpt-4o+gpt-4"
  }
}
```

## 평가 기준

### 1. 기술적 우수성 (Technical Excellence)

- 코드 복잡도와 구현 품질
- 아키텍처 설계 수준
- 기술적 혁신성
- 문제 해결 능력

### 2. 임팩트와 가치 (Impact & Value)

- 비즈니스 임팩트
- 기술적 기여도
- 성능 개선 효과
- 사용자 경험 향상

### 3. 코드 품질 (Code Quality)

- 유지보수성
- 가독성
- 테스트 커버리지
- 코딩 스타일 일관성

### 4. 협업 능력 (Collaboration)

- PR 리뷰 품질
- 커뮤니케이션 능력
- 팀워크
- 지식 공유

## 환경 설정

### 1. 필수 환경 변수

```env
# OpenAI API (평가 및 리포트 생성)
OPENAI_API_KEY=your_openai_api_key

# Anthropic API (데이터 분석)
ANTHROPIC_API_KEY=your_anthropic_api_key

# AI 모델 설정 (선택사항)
EVALUATION_MODEL=gpt-4o
ANALYSIS_MODEL=claude-3-5-sonnet-20241022
REPORT_MODEL=gpt-4
```

### 2. 대안 설정

Azure OpenAI 사용 시:

```env
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_KEY=your_azure_key
```

## 사용 예제

### 1. TypeScript/JavaScript 클라이언트

```typescript
import axios from 'axios';

const evaluatePerformance = async (performanceId: string, token: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/performances/${performanceId}/evaluate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Evaluation failed:', error);
    throw error;
  }
};
```

### 2. Python 클라이언트

```python
import requests

def evaluate_performance(performance_id, token):
    url = f"{API_BASE_URL}/performances/{performance_id}/evaluate"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Evaluation failed: {response.status_code}")
```

## 성능 최적화 고려사항

### 1. 캐싱 전략

- 동일한 Performance에 대한 중복 평가 방지
- Reference 데이터 캐싱으로 GitHub API 호출 최소화

### 2. 비동기 처리

- 백그라운드 작업으로 평가 수행
- 웹훅을 통한 완료 알림

### 3. 비용 최적화

- **모델 최적화**: o1-mini (평가), GPT-4o (리포트)로 성능 대비 비용 60% 절감
- **단계별 모델 할당**: 각 작업에 최적화된 모델 사용
- 필요시 더 저렴한 모델로 교체 가능한 구조

## 확장 가능성

### 1. 새로운 Reference 타입 추가

```typescript
// 예: JIRA 이슈 연동
REFERENCE_SOURCE_TYPE.JIRA_ISSUE = 'JIRA_ISSUE';
```

### 2. 커스텀 평가 기준

```typescript
// 평가 템플릿 커스터마이징
interface CustomEvaluationCriteria {
  domain: string; // 'frontend', 'backend', 'devops' 등
  weights: {
    technical: number;
    impact: number;
    quality: number;
    collaboration: number;
  };
}
```

### 3. 다국어 지원

- 프롬프트 템플릿 다국어화
- 평가 결과 번역 기능

## 모니터링 및 로깅

- AI 평가 요청/응답 로그
- 모델별 성능 메트릭
- 비용 추적 및 알림
- 평가 품질 피드백 수집

## 환경 변수 설정

AI 평가에 필요한 환경 변수들:

```bash
# AI Model Configuration
EVALUATION_MODEL=o1-mini          # 평가 단계 - 높은 일관성과 체계성
ANALYSIS_MODEL=claude-3-5-sonnet-20241022  # 분석 단계 - 코드 분석 최적화
REPORT_MODEL=gpt-4o               # 리포트 단계 - 비용 효율성 개선

# API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## 보안 고려사항

- API 키 암호화 저장
- 사용자별 평가 권한 제어
- 개인정보 마스킹 처리
- 평가 결과 접근 로그

---

이 AI 평가 agent는 개발자의 성과를 객관적이고 일관성 있게 평가하여, 개인의 성장과 팀의 발전에 기여할 수 있는 인사이트를 제공합니다.
