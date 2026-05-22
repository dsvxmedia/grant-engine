'use client'

import Link from 'next/link'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { formatCurrency } from '@/lib/utils'
import type { KanbanCard } from './types'

interface GrantCardProps {
  card: KanbanCard
}

export function GrantCard({ card }: GrantCardProps) {
  const awardRange =
    card.awardMin != null && card.awardMax != null
      ? `${formatCurrency(card.awardMin)} – ${formatCurrency(card.awardMax)}`
      : card.awardMax != null
        ? `Up to ${formatCurrency(card.awardMax)}`
        : null

  const deadline = card.deadline ? new Date(card.deadline) : null

  const inner = (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug line-clamp-1 flex-1">
          {card.title}
        </span>
        {card.fitScore != null && <ScoreBadge score={card.fitScore} />}
      </div>

      {card.funderName && (
        <span className="text-xs text-muted-foreground truncate">
          {card.funderName}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {awardRange && (
          <span className="text-xs text-muted-foreground">{awardRange}</span>
        )}
        {deadline && <DeadlineChip deadline={deadline} />}
      </div>

      {card.entityName && (
        <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {card.entityName}
        </span>
      )}
    </div>
  )

  if (card.isReviewable && card.applicationId) {
    return (
      <Link href={`/review/${card.applicationId}`} className="block">
        {inner}
      </Link>
    )
  }

  return inner
}
