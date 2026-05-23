import { createServiceClient } from '@/lib/supabase/server'

export type MatchRecord = {
  grant_id: string
  entity_id: string
  hard_filter_passed: boolean
  hard_filter_failures: string[]
  fit_score: number | null
  competitive_density_score: null
  matched_angles: string[]
  status: 'queued' | 'pending_review' | 'rejected' | 'archived'
}

export type PersistMatchesResult = {
  upserted: number
  errors: number
}

function resolveStatus(input: {
  hard_filter_passed: boolean
  fit_score: number | null
}): MatchRecord['status'] {
  if (!input.hard_filter_passed) return 'rejected'
  if (input.fit_score === null) return 'rejected'
  if (input.fit_score >= 70) return 'queued'
  if (input.fit_score >= 50) return 'pending_review'
  return 'archived'
}

export function buildMatchRecord(input: {
  grant_id: string
  entity_id: string
  hard_filter_passed: boolean
  hard_filter_failures: string[]
  fit_score: number | null
  matched_angles: string[]
}): MatchRecord {
  return {
    grant_id: input.grant_id,
    entity_id: input.entity_id,
    hard_filter_passed: input.hard_filter_passed,
    hard_filter_failures: input.hard_filter_failures,
    fit_score: input.fit_score,
    competitive_density_score: null,
    matched_angles: input.matched_angles,
    status: resolveStatus({
      hard_filter_passed: input.hard_filter_passed,
      fit_score: input.fit_score,
    }),
  }
}

export async function persistMatches(
  records: MatchRecord[],
): Promise<PersistMatchesResult> {
  if (records.length === 0) {
    return { upserted: 0, errors: 0 }
  }

  const supabase = await createServiceClient()
  const { error } = await (supabase as any)
    .from('grant_matches')
    .upsert(records, { onConflict: 'grant_id,entity_id' })

  if (error) {
    console.error('[matching/persist] upsert failed', error)
    return { upserted: 0, errors: records.length }
  }

  return { upserted: records.length, errors: 0 }
}
