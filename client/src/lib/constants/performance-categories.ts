import { PerformanceCategory } from '@/src/lib/types/perfomance'

export const PERFORMANCE_CATEGORIES: Readonly<PerformanceCategory[]> = [
  {
    id: 'technical_excellence',
    title: '기술적 우수성',
    score: 4.1,
    maxScore: 5,
    color: 'blue',
    isExpanded: false
  },
  {
    id: 'impact_value',
    title: '영향력과 가치',
    score: 3.0,
    maxScore: 5,
    color: 'blue',
    isExpanded: false
  },
  {
    id: 'code_quality',
    title: '코드 품질',
    score: 3.5,
    maxScore: 5,
    color: 'blue',
    isExpanded: false
  },
  {
    id: 'collaboration',
    title: '협업',
    score: 3.5,
    maxScore: 5,
    color: 'blue',
    isExpanded: false
  }
] as const
