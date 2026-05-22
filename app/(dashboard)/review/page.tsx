import { Header } from '@/components/layout/Header'
import { ReviewQueue } from '@/components/review/ReviewQueue'
import { createServiceClient } from '@/lib/supabase/server'
import type { ApplicationRecord } from '@/components/pipeline/types'

export default async function ReviewQueuePage() {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .select('*, grants(title, funder_name, award_min, award_max, deadline), business_entities(id, name)')
    .eq('status', 'pending_review')
    .order('deadline', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Review queue fetch failed:', error)
  }

  const applications: ApplicationRecord[] = data ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Review Queue" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <ReviewQueue applications={applications} />
        </div>
      </div>
    </div>
  )
}
