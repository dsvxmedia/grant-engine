'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { formatCurrency } from '@/lib/utils'
import type { MatchRecord } from '@/components/pipeline/types'

interface MatchReviewListProps {
  matches: MatchRecord[]
}

const FUNDER_TYPE_LABEL: Record<string, string> = {
  federal:     'Federal',
  state:       'State',
  foundation:  'Foundation',
  corporate:   'Corporate',
  niche:       'Other',
}

export function MatchReviewList({ matches }: MatchReviewListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function queueForDrafting(matchId: string) {
    setActionLoading(matchId)
    try {
      await fetch(`/api/matches/${matchId}/queue`, { method: 'PATCH' })
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  async function archiveMatch(matchId: string) {
    setActionLoading(matchId)
    try {
      await fetch(`/api/matches/${matchId}/archive`, { method: 'PATCH' })
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No matched grants pending review.</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {matches.map((match) => {
        const grant = match.grants
        const entity = match.business_entities
        const deadline = grant?.deadline ? new Date(grant.deadline) : null
        const isLoading = actionLoading === match.id
        const busy = isPending || isLoading

        const awardRange =
          grant?.award_min != null && grant?.award_max != null
            ? `${formatCurrency(grant.award_min)} – ${formatCurrency(grant.award_max)}`
            : grant?.award_max != null
              ? `Up to ${formatCurrency(grant.award_max)}`
              : grant?.award_min != null
                ? `From ${formatCurrency(grant.award_min)}`
                : null

        const funderTypeLabel = grant?.funder_type ? FUNDER_TYPE_LABEL[grant.funder_type] ?? grant.funder_type : null

        return (
          <div
            key={match.id}
            className="flex flex-col gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium leading-snug line-clamp-2">
                  {grant?.title ?? 'Untitled Grant'}
                </span>
                {grant?.funder_name && (
                  <span className="text-xs text-muted-foreground truncate">
                    {grant.funder_name}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {match.fit_score != null && <ScoreBadge score={Math.round(match.fit_score)} />}
                {deadline && <DeadlineChip deadline={deadline} />}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {entity && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {entity.name}
                </span>
              )}
              {funderTypeLabel && (
                <Badge variant="outline" className="text-xs h-5">
                  {funderTypeLabel}
                </Badge>
              )}
              {awardRange && (
                <span className="text-xs text-muted-foreground">{awardRange}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs"
                disabled={busy}
                onClick={() => queueForDrafting(match.id)}
              >
                Queue for Drafting
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                disabled={busy}
                onClick={() => archiveMatch(match.id)}
              >
                Skip
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
