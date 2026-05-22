import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { VideoActions } from '@/components/video/VideoActions'
import { cn } from '@/lib/utils'
import type { VideoJobStatus } from '@/lib/video/types'

const STATUS_CHIP: Record<VideoJobStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-slate-100 text-slate-700' },
  rendering: { label: 'Rendering', className: 'bg-blue-100 text-blue-700' },
  ready:     { label: 'Ready for Review', className: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Approved',  className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  submitted: { label: 'Submitted', className: 'bg-slate-200 text-slate-800' },
}

export default async function VideoReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: submission } = await (supabase as any)
    .from('video_submissions')
    .select('*, grants(title, funder_name, award_min, award_max, deadline)')
    .eq('id', id)
    .maybeSingle()

  if (!submission) {
    notFound()
  }

  const chip = STATUS_CHIP[submission.render_status as VideoJobStatus] ?? STATUS_CHIP.pending
  const grantTitle: string = submission.grants?.title ?? 'Untitled Grant'
  const funderName: string | null = submission.grants?.funder_name ?? null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{grantTitle}</h1>
        {funderName && (
          <p className="text-sm text-muted-foreground mt-0.5">{funderName}</p>
        )}
      </div>

      {/* AI Disclosure — prominent, not dismissible */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
        <p className="text-sm font-medium text-amber-900">AI Disclosure Required</p>
        <p className="text-sm text-amber-800 mt-0.5">
          This video was generated using AI tools (HeyGen avatar + ElevenLabs voice clone).
          AI disclosure is required for submission.
        </p>
      </div>

      {/* Video player */}
      <div className="mb-6">
        {submission.video_url ? (
          <video
            controls
            src={submission.video_url}
            className="w-full rounded-lg border border-border bg-black"
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 h-48">
            <p className="text-sm text-muted-foreground">Video rendering in progress…</p>
          </div>
        )}
      </div>

      {/* Status + duration */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            chip.className
          )}
        >
          {chip.label}
        </span>
        {submission.duration_seconds != null && (
          <span className="text-sm text-muted-foreground">
            {Math.round(submission.duration_seconds)}s
          </span>
        )}
      </div>

      {/* Script */}
      {submission.script_content && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-2">Script</h2>
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {submission.script_content}
            </p>
          </div>
        </div>
      )}

      {/* Action bar */}
      <VideoActions
        submissionId={submission.id}
        grantMatchId={submission.grant_match_id ?? null}
      />
    </div>
  )
}
