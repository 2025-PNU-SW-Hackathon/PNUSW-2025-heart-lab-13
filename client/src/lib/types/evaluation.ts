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
