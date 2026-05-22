export type QAScore = {
  score: number     // 0-10
  issues: string[]  // specific problems found
  passed: boolean   // score >= 7.0
}

export type QADimension = 'narrative' | 'clarity' | 'compliance'

export type QAResult = {
  narrative: QAScore
  clarity: QAScore
  compliance: QAScore
  overallPassed: boolean        // all three >= 7.0
  retryCount: number
  flaggedForManualReview: boolean
}

export type QAInput = {
  applicationId: string
  draftText: string            // full raw text of the application
  grantTitle: string
  funderType: string | null
  requiredSections: string[]   // for compliance check
  wordLimits: Record<string, number>
  qaRetryCount: number         // current retry count from grant_applications
}
