import { ClipboardList } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { ReviewQueue } from '@/components/review/ReviewQueue'
import { MatchReviewList } from '@/components/review/MatchReviewList'
import { EmptyState } from '@/components/shared/EmptyState'
import { createServiceClient } from '@/lib/supabase/server'
import type { ApplicationRecord, MatchRecord } from '@/components/pipeline/types'

export default async function ReviewQueuePage() {
  const supabase = await createServiceClient()

  // Written applications ready for approval before submission
  const { data: appsRaw, error: appsError } = await (supabase as any)
    .from('grant_applications')
    .select('*, grants(title, funder_name, award_min, award_max, deadline), business_entities(id, name)')
    .eq('status', 'pending_review')
    .order('deadline', { ascending: true, nullsFirst: false })

  if (appsError) console.error('Applications fetch failed:', appsError)
  const applications: ApplicationRecord[] = appsRaw ?? []

  // Matched grants needing a "should we draft this?" decision.
  // Fetch more than we need (500) then deduplicate by grant_id server-side,
  // keeping only the highest-scoring entity match per grant. This prevents the
  // same grant from appearing multiple times (once per matched entity).
  const { data: matchesRaw, error: matchesError } = await (supabase as any)
    .from('grant_matches')
    .select('*, score_components, grants(title, funder_name, funder_type, source, source_url, application_url, award_min, award_max, deadline, description, category_tags, eligibility_tags, requires_loi, coalition_preferred), business_entities(id, name)')
    .eq('status', 'pending_review')
    .order('fit_score', { ascending: false })
    .limit(500)

  if (matchesError) console.error('Matches fetch failed:', matchesError)
  const allMatches: MatchRecord[] = matchesRaw ?? []

  // Deduplicate: keep highest fit_score match per grant_id
  const seenGrantIds = new Set<string>()
  const matches: MatchRecord[] = []
  for (const m of allMatches) {
    const grantId = m.grant_id
    if (!grantId || seenGrantIds.has(grantId)) continue
    seenGrantIds.add(grantId)
    matches.push(m)
    if (matches.length >= 100) break
  }

  const totalUniqueGrants = seenGrantIds.size

  const { count: totalMatchRecords } = await (supabase as any)
    .from('grant_matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review')

  const isEmpty = applications.length === 0 && matches.length === 0

  return (
    <div className="flex flex-col h-full">
      <Header title="Review Queue" />
      <div className="flex-1 overflow-y-auto p-6">

        {isEmpty ? (
          <EmptyState
            icon={ClipboardList}
            title="Queue is clear"
            description="No applications waiting for approval and no matched grants to triage. The discovery engine runs daily at 6am UTC — check back after the next run."
          />
        ) : (
          <div className="max-w-3xl flex flex-col gap-8">

            {/* Written applications — approve before submission */}
            {applications.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold">Ready to Submit</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Written applications that passed QA — approve or request changes.
                  </p>
                </div>
                <ReviewQueue applications={applications} />
              </section>
            )}

            {/* Matched grants — decide whether to draft */}
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Matched Grants</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalUniqueGrants} unique grant{totalUniqueGrants !== 1 ? 's' : ''} scored 50–69 — review and queue the ones worth applying for.
                  </p>
                </div>
                {totalUniqueGrants > matches.length && (
                  <span className="text-xs text-muted-foreground">
                    Showing top {matches.length} of {totalUniqueGrants}
                  </span>
                )}
              </div>
              <MatchReviewList matches={matches} />
            </section>

          </div>
        )}

      </div>
    </div>
  )
}
