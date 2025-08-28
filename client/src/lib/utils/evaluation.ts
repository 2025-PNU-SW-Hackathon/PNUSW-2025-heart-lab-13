/** 서버 응답 → PerformanceCategory[] */

import { PerformanceCategory } from '../types/perfomance'
import type { EvaluationJSON } from '../types/evaluation'
export default function mapEvaluationToCategories(payload: EvaluationJSON): PerformanceCategory[] {
  const ev = payload.evaluation || ({} as EvaluationJSON['evaluation'])

  const desc = (...parts: Array<string | undefined | null>) => parts.filter(Boolean).join('\n')

  return [
    {
      id: 'technical_excellence',
      title: '기술적 우수성',
      score: ev.technicalExcellence?.score ?? 0,
      maxScore: 10,
      color: 'blue',
      isExpanded: false,
      description: desc(
        ev.technicalExcellence?.details,
        ev.technicalExcellence?.keyStrengths?.length
          ? `강점: ${ev.technicalExcellence?.keyStrengths?.join(', ')}`
          : undefined,
        ev.technicalExcellence?.areasForImprovement?.length
          ? `개선점: ${ev.technicalExcellence?.areasForImprovement?.join(', ')}`
          : undefined
      )
    },
    {
      id: 'impact_value',
      title: '영향력과 가치',
      score: ev.impactAndValue?.score ?? 0,
      maxScore: 10,
      color: 'blue',
      isExpanded: false,
      description: desc(
        ev.impactAndValue?.details,
        ev.impactAndValue?.businessImpact
          ? `비즈니스 임팩트: ${ev.impactAndValue?.businessImpact}`
          : undefined,
        ev.impactAndValue?.technicalImpact
          ? `기술적 임팩트: ${ev.impactAndValue?.technicalImpact}`
          : undefined
      )
    },
    {
      id: 'code_quality',
      title: '코드 품질',
      score: ev.codeQuality?.score ?? 0,
      maxScore: 5,
      color: 'blue',
      isExpanded: false,
      description: desc(
        ev.codeQuality?.details,
        typeof ev.codeQuality?.maintainability === 'number'
          ? `유지보수성: ${ev.codeQuality?.maintainability}/10`
          : undefined,
        typeof ev.codeQuality?.readability === 'number'
          ? `가독성: ${ev.codeQuality?.readability}/10`
          : undefined,
        ev.codeQuality?.testCoverage
          ? `테스트 커버리지: ${ev.codeQuality?.testCoverage}`
          : undefined
      )
    },
    {
      id: 'collaboration',
      title: '협업',
      score: ev.collaboration?.score ?? 0,
      maxScore: 10,
      color: 'blue',
      isExpanded: false,
      description: desc(
        ev.collaboration?.details,
        ev.collaboration?.communicationQuality
          ? `커뮤니케이션: ${ev.collaboration?.communicationQuality}`
          : undefined,
        ev.collaboration?.teamwork ? `팀워크: ${ev.collaboration?.teamwork}` : undefined
      )
    }
  ]
}
