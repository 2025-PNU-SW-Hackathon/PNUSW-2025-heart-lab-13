// types/performance.ts
export interface PerformanceCategory {
  id: string
  title: string
  score: number
  maxScore: number
  icon?: React.ReactNode
  description?: string
  isExpanded?: boolean
  color?: 'blue' | 'gray' | 'green' | 'yellow' | 'red'
}
