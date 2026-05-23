'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { GrantDetailSheet } from '@/components/shared/GrantDetailSheet'
import { formatCurrency } from '@/lib/utils'
import type { KanbanCard } from './types'

interface GrantCardProps {
  card: KanbanCard
}

export function GrantCard({ card }: GrantCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const awardRange =
    card.awardMin != null && card.awardMax != null
      ? `${formatCurrency(card.awardMin)} – ${formatCurrency(card.awardMax)}`
      : card.awardMax != null
        ? `Up to ${formatCurrency(card.awardMax)}`
        : null

  const deadline = card.deadline ? new Date(card.deadline) : null

  const inner = (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug line-clamp-2 flex-1">
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

  // Reviewable cards (pending_review applications) still navigate to review page
  if (card.isReviewable && card.applicationId) {
    return (
      <Link href={`/review/${card.applicationId}`} className="block">
        {inner}
      </Link>
    )
  }

  return (
    <>
      <div onClick={() => setSheetOpen(true)}>
        {inner}
      </div>
      <GrantDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        data={{
          title: card.title,
          funderName: card.funderName,
          funderType: card.funderType,
          awardMin: card.awardMin,
          awardMax: card.awardMax,
          deadline: card.deadline,
          description: card.description,
          sourceUrl: card.sourceUrl,
          applicationUrl: card.applicationUrl,
          eligibilityTags: card.eligibilityTags,
          categoryTags: card.categoryTags,
          requiresLoi: card.requiresLoi,
          fitScore: card.fitScore,
          entityName: card.entityName,
          matchedAngles: card.matchedAngles,
        }}
      />
    </>
  )
}
