import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreNarrative } from '@/lib/qa/narrative'
import { scoreClarity } from '@/lib/qa/clarity'
import { scoreCompliance } from '@/lib/qa/compliance'
import type { QAInput, QAResult } from '@/lib/qa/types'

export async function runQAGate(applicationId: string): Promise<QAResult> {
  const supabase = await createServiceClient()

  // Step 1: Fetch the application
  const { data: application, error: appError } = await (supabase as any)
    .from('grant_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle()

  if (appError) {
    throw new Error(`[qa/gate] Failed to fetch application ${applicationId}: ${appError.message}`)
  }
  if (!application) {
    throw new Error(`[qa/gate] Application not found: ${applicationId}`)
  }

  // Step 2: Fetch the grant
  const { data: grant, error: grantError } = await (supabase as any)
    .from('grants')
    .select('*')
    .eq('id', application.grant_id)
    .maybeSingle()

  if (grantError) {
    throw new Error(`[qa/gate] Failed to fetch grant ${application.grant_id}: ${grantError.message}`)
  }

  // Step 3: Build QAInput
  const sections: Array<{ name: string; content: string }> =
    application.draft_content?.sections ?? []

  const draftText =
    sections.length > 0
      ? sections.map((s) => `## ${s.name}\n\n${s.content}`).join('\n\n')
      : JSON.stringify(application.draft_content ?? {})

  const input: QAInput = {
    applicationId,
    draftText,
    grantTitle: grant?.title ?? 'Unknown Grant',
    funderType: grant?.funder_type ?? null,
    requiredSections: sections.map((s) => s.name),
    wordLimits: {},
    qaRetryCount: application.qa_retry_count ?? 0,
  }

  // Step 4: Run all 3 scorers concurrently
  const [narrative, clarity, compliance] = await Promise.all([
    scoreNarrative(input),
    scoreClarity(input),
    scoreCompliance(input),
  ])

  // Step 5: Determine overall result
  const overallPassed = narrative.passed && clarity.passed && compliance.passed
  const currentRetryCount: number = application.qa_retry_count ?? 0
  const flaggedForManualReview = !overallPassed && currentRetryCount >= 2

  // Step 6: Determine new status
  let status: string
  if (overallPassed) {
    status = 'pending_review'
  } else if (currentRetryCount < 2) {
    status = 'drafting'
  } else {
    status = 'qa_failed'
  }

  // Step 7: Persist QA scores and updated status
  const updatePayload: Record<string, unknown> = {
    qa_scores: { narrative, clarity, compliance },
    qa_passed: overallPassed,
    qa_retry_count: currentRetryCount + 1,
    status,
  }
  if (flaggedForManualReview) {
    updatePayload.flagged_for_manual_review = true
  }

  await (supabase as any)
    .from('grant_applications')
    .update(updatePayload)
    .eq('id', applicationId)
    .select()
    .single()

  return {
    narrative,
    clarity,
    compliance,
    overallPassed,
    retryCount: currentRetryCount,
    flaggedForManualReview,
  }
}
