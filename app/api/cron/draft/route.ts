import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runWritingPipeline } from '@/lib/writing/pipeline'

// Fetch up to this many candidates; stop early if time budget runs low
const BATCH_SIZE = 3

// Stop starting new apps if we're within this many ms of the 300s limit
const TIME_BUDGET_MS = 260_000

export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const supabase = await createServiceClient()

  // Fetch queued matches for active entities (TCS + FlowTech), highest score first
  const { data: queuedMatches, error: fetchError } = await (supabase as any)
    .from('grant_matches')
    .select('id, grant_id, entity_id, fit_score, business_entities!inner(matching_active)')
    .eq('status', 'queued')
    .eq('business_entities.matching_active', true)
    .order('fit_score', { ascending: false })
    .limit(BATCH_SIZE)

  if (fetchError) {
    console.error('[cron/draft] Failed to fetch queued matches:', fetchError)
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 })
  }

  const matches: Array<{ id: string; grant_id: string; entity_id: string; fit_score: number }> =
    queuedMatches ?? []

  if (matches.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'No queued matches to draft' })
  }

  const results: Array<{ matchId: string; status: string; applicationId?: string; error?: string }> = []

  for (const match of matches) {
    // Stop before starting a new pipeline if we're running low on time
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      console.log('[cron/draft] Time budget reached — deferring remaining matches to next run')
      break
    }

    try {
      console.log(`[cron/draft] Starting pipeline for match ${match.id} (score: ${match.fit_score})`)
      const result = await runWritingPipeline(match.id)
      results.push({ matchId: match.id, status: result.status, applicationId: result.applicationId })
      console.log(`[cron/draft] Completed match ${match.id} → application ${result.applicationId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron/draft] Pipeline failed for match ${match.id}:`, message)

      // Mark match so it can be manually reviewed rather than retried infinitely
      await (supabase as any)
        .from('grant_matches')
        .update({ status: 'qa_review' })
        .eq('id', match.id)

      results.push({ matchId: match.id, status: 'failed', error: message })
    }
  }

  const succeeded = results.filter((r) => r.status === 'pending_review').length
  const failed = results.filter((r) => r.status === 'failed').length
  const elapsedMs = Date.now() - startedAt

  console.log(`[cron/draft] Done: ${succeeded} succeeded, ${failed} failed in ${elapsedMs}ms`)

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded,
    failed,
    elapsed_ms: elapsedMs,
    results,
    timestamp: new Date().toISOString(),
  })
}
