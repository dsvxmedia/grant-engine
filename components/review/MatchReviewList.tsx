'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { GrantDetailSheet, type GrantDetailData } from '@/components/shared/GrantDetailSheet'
import { formatCurrency } from '@/lib/utils'
import type { MatchRecord } from '@/components/pipeline/types'

interface MatchReviewListProps {
  matches: MatchRecord[]
}

const FUNDER_TYPE_LABEL: Record<string, string> = {
  federal:    'Federal',
  state:      'State',
  foundation: 'Foundation',
  corporate:  'Corporate',
  niche:      'Other',
}

export function MatchReviewList({ matches }: MatchReviewListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<GrantDetailData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const visible = q
    ? matches.filter(
        (m) =>
          (m.grants?.title ?? '').toLowerCase().includes(q) ||
          (m.grants?.funder_name ?? '').toLowerCase().includes(q) ||
          (m.business_entities?.name ?? '').toLowerCase().includes(q)
      )
    : matches

  function openDetail(match: MatchRecord) {
    const grant = match.grants
    setDetailData({
      title: grant?.title ?? 'Untitled Grant',
      funderName: grant?.funder_name,
      funderType: grant?.funder_type,
      awardMin: grant?.award_min,
      awardMax: grant?.award_max,
      deadline: grant?.deadline,
      description: grant?.description,
      sourceUrl: grant?.source_url,
      applicationUrl: grant?.application_url,
      eligibilityTags: (grant?.eligibility_tags ?? []) as string[],
      categoryTags: (grant?.category_tags ?? []) as string[],
      requiresLoi: grant?.requires_loi ?? false,
      coalitionPreferred: grant?.coalition_preferred ?? false,
      fitScore: match.fit_score,
      entityName: match.business_entities?.name,
      matchedAngles: match.matched_angles,
    })
    setSheetOpen(true)
  }

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
    <>
      {/* Search bar */}
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search grants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
      </div>

      {visible.length === 0 && q && (
        <p className="text-sm text-muted-foreground">No grants match &ldquo;{search}&rdquo;.</p>
      )}

      <div className="flex flex-col gap-2">
        {visible.map((match) => {
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

          const funderTypeLabel = grant?.funder_type
            ? (FUNDER_TYPE_LABEL[grant.funder_type] ?? grant.funder_type)
            : null

          return (
            <div
              key={match.id}
              className="flex flex-col gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              {/* Clickable header — opens detail sheet */}
              <button
                className="flex items-start justify-between gap-3 text-left w-full hover:opacity-80 transition-opacity"
                onClick={() => openDetail(match)}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium leading-snug line-clamp-2 text-sm">
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
              </button>

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

      {/* Single shared detail sheet */}
      {detailData && (
        <GrantDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          data={detailData}
        />
      )}
    </>
  )
}
