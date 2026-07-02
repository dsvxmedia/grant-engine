import { FileText } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { LoiCard, type LoiSubmission } from '@/components/loi/LoiCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { createServiceClient } from '@/lib/supabase/server'

async function fetchSubmissions(): Promise<LoiSubmission[]> {
  const supabase = await createServiceClient()
  const { data, error } = await (supabase as any)
    .from('loi_submissions')
    .select('*, grants(id, title, funder_name, award_min, award_max, loi_deadline), business_entities(id, name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('LOI page fetch failed:', error)
    return []
  }

  return data ?? []
}

export default async function LoiQueuePage() {
  const submissions = await fetchSubmissions()

  return (
    <div className="flex flex-col h-full">
      <Header title="LOI Queue" />
      <div className="flex-1 overflow-y-auto p-6">
        {submissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No LOI drafts yet"
            description="When the matching engine identifies grants that require a Letter of Inquiry, they'll appear here for review and submission before the full application is triggered."
          />
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {submissions.map((submission) => (
              <LoiCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
