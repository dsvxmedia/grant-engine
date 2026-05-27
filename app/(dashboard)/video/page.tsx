import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { createServiceClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { VideoJobStatus } from '@/lib/video/types'

type VideoSubmissionRow = {
  id: string
  render_status: VideoJobStatus
  created_at: string
  grant_match_id: string | null
  grants: {
    title: string
    funder_name: string | null
    award_min: number | null
    award_max: number | null
    deadline: string | null
  } | null
}

const STATUS_CHIP: Record<VideoJobStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-slate-100 text-slate-700' },
  rendering: { label: 'Rendering', className: 'bg-blue-100 text-blue-700' },
  ready:     { label: 'Ready',     className: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Approved',  className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  submitted: { label: 'Submitted', className: 'bg-slate-200 text-slate-800' },
}

function formatAward(min: number | null, max: number | null) {
  if (!min && !max) return '—'
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (max) return `Up to ${fmt(max)}`
  return fmt(min!)
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return '—'
  return new Date(deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function VideoQueuePage() {
  const supabase = await createServiceClient()
  const { data: submissions } = await (supabase as any)
    .from('video_submissions')
    .select('*, grants(title, funder_name, award_min, award_max, deadline)')
    .order('created_at', { ascending: false })

  const rows: VideoSubmissionRow[] = submissions ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Video Queue" />
      <div className="flex-1 overflow-y-auto p-6">
      <p className="text-sm text-muted-foreground mb-4">
        AI-generated pitch videos for grants requiring video submissions. (V3 feature)
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No video submissions yet. Grants requiring video pitches appear here once discovered.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Grant Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Funder</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Award</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Video Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((sub) => {
                const chip = STATUS_CHIP[sub.render_status] ?? STATUS_CHIP.pending
                const canReview = sub.render_status === 'ready' || sub.render_status === 'approved'
                return (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {sub.grants?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.grants?.funder_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatAward(sub.grants?.award_min ?? null, sub.grants?.award_max ?? null)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDeadline(sub.grants?.deadline ?? null)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          chip.className
                        )}
                      >
                        {chip.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canReview && (
                          <Link
                            href={`/video/${sub.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Review
                          </Link>
                        )}
                        {!canReview && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
