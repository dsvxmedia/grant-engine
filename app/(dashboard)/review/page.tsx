import { Header } from '@/components/layout/Header'
import { ReviewQueue } from '@/components/review/ReviewQueue'
import { MatchReviewList } from '@/components/review/MatchReviewList'
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

  // Matched grants needing a "should we draft this?" decision
  const { data: matchesRaw, error: matchesError } = await (supabase as any)
    .from('grant_matches')
    .select('*, grants(title, funder_name, funder_type, source, award_min, award_max, deadline, category_tags, eligibility_tags), business_entities(id, name)')
    .eq('status', 'pending_review')
    .order('fit_score', { ascending: false })
    .limit(100)

  if (matchesError) console.error('Matches fetch failed:', matchesError)
  const matches: MatchRecord[] = matchesRaw ?? []

  const { count: totalMatches } = await (supabase as any)
    .from('grant_matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review')

  return (
    <div className="flex flex-col h-full">
      <Header title="Review Queue" />
      <div className="flex-1 overflow-y-auto p-6">
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
                  {totalMatches ?? matches.length} grants scored 50–69 — review and queue the ones worth applying for.
                </p>
              </div>
              {(totalMatches ?? 0) > matches.length && (
                <span className="text-xs text-muted-foreground">
                  Showing top {matches.length} of {totalMatches}
                </span>
              )}
            </div>
            <MatchReviewList matches={matches} />
          </section>

        </div>
      </div>
    </div>
  )
}
