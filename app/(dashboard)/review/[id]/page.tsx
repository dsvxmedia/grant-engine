import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ApplicationDraft } from '@/components/review/ApplicationDraft'
import { ApplicationReviewFooter } from '@/components/review/ApplicationReviewFooter'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { ApplicationRecord } from '@/components/pipeline/types'

type PageProps = { params: Promise<{ id: string }> }

const QA_DIMS = [
  { key: 'narrative', label: 'Narrative' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'compliance', label: 'Compliance' },
]

function QaScoreBar({
  label,
  score,
}: {
  label: string
  score: number | null | undefined
}) {
  const passed = score != null ? score >= 7.0 : null
  const pct = score != null ? Math.min(100, score * 10) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={passed === false ? 'font-medium tabular-nums text-red-600' : passed ? 'font-medium tabular-nums text-green-600' : 'font-medium tabular-nums'}>
          {score != null ? score.toFixed(1) : '—'}<span className="text-muted-foreground">/10</span>
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={passed === false ? 'h-full rounded-full bg-red-400 transition-all' : passed ? 'h-full rounded-full bg-green-500 transition-all' : 'h-full rounded-full bg-slate-300 transition-all'}
          style={{ width: `${pct}%` }}
        />
        {/* pass threshold marker at 70% */}
        <div className="absolute inset-y-0 w-px bg-slate-400/60" style={{ left: '70%' }} />
      </div>
    </div>
  )
}

export default async function ApplicationReviewPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .select(
      '*, grants(title, funder_name, award_min, award_max, deadline, source_url), business_entities(id, name)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`Review page fetch failed for id=${id}:`, error)
  }

  if (!data) {
    notFound()
  }

  const app = data as ApplicationRecord & {
    draft_pdf_url?: string | null
    draft_docx_url?: string | null
    matched_angles?: string[] | null
  }

  const grant = app.grants
  const deadline = grant?.deadline ? new Date(grant.deadline) : null
  const awardRange =
    grant?.award_min != null && grant?.award_max != null
      ? `${formatCurrency(grant.award_min)} – ${formatCurrency(grant.award_max)}`
      : grant?.award_max != null
        ? `Up to ${formatCurrency(grant.award_max)}`
        : null

  const qaScores = app.qa_scores as Record<string, number> | null
  const matchedAngles = app.matched_angles ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Application Review" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left — draft content (65%) */}
          <div className="flex-1 min-w-0">
            <ApplicationDraft application={app} />
          </div>

          {/* Right — grant meta + QA evaluation panel (35%) */}
          <aside className="w-full shrink-0 lg:w-72 xl:w-80">
            <div className="sticky top-0 rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
              {/* Grant info */}
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-sm leading-snug">
                  {grant?.title ?? 'Untitled Grant'}
                </h2>
                {grant?.funder_name && (
                  <p className="text-xs text-muted-foreground">{grant.funder_name}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm border-t border-border pt-4">
                {awardRange && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Award range</span>
                    <span className="text-xs font-medium tabular-nums">{awardRange}</span>
                  </div>
                )}

                {deadline && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Deadline</span>
                    <DeadlineChip deadline={deadline} />
                  </div>
                )}

                {app.fit_score != null && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Fit score</span>
                    <ScoreBadge score={app.fit_score} />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Status</span>
                  <StatusBadge status={app.status} />
                </div>
              </div>

              {/* QA scores as progress bars */}
              {qaScores && (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">QA Scores</p>
                  <div className="flex flex-col gap-3">
                    {QA_DIMS.map(({ key, label }) => (
                      <QaScoreBar key={key} label={label} score={qaScores[key]} />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">Pass threshold: 7.0 (dashed line)</p>
                </div>
              )}

              {/* Matched angles */}
              {matchedAngles.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Matched angles</p>
                  <div className="flex flex-wrap gap-1">
                    {matchedAngles.map((angle, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {angle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky action footer — always visible regardless of scroll position */}
      <ApplicationReviewFooter
        applicationId={app.id}
        status={app.status}
        grantTitle={grant?.title}
        deadline={grant?.deadline}
        qaScores={qaScores}
      />
    </div>
  )
}
