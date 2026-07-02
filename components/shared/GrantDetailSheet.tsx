'use client'

import { Calendar, DollarSign, Building2, ExternalLink, Tag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { FitScoreBreakdown } from '@/components/shared/FitScoreBreakdown'
import { formatCurrency, formatDeadline, isUrgent, cn } from '@/lib/utils'
import type { ScoreComponents } from '@/components/pipeline/types'

const FUNDER_TYPE_LABEL: Record<string, string> = {
  federal: 'Federal',
  state: 'State',
  foundation: 'Foundation',
  corporate: 'Corporate',
  niche: 'Other',
}

export type GrantDetailData = {
  title: string
  funderName?: string | null
  funderType?: string | null
  awardMin?: number | null
  awardMax?: number | null
  deadline?: string | null
  description?: string | null
  sourceUrl?: string | null
  applicationUrl?: string | null
  eligibilityTags?: string[]
  categoryTags?: string[]
  requiresLoi?: boolean
  coalitionPreferred?: boolean
  fitScore?: number | null
  scoreComponents?: ScoreComponents | null
  entityName?: string | null
  matchedAngles?: string[] | null
}

interface GrantDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: GrantDetailData
}

export function GrantDetailSheet({ open, onOpenChange, data }: GrantDetailSheetProps) {
  const {
    title, funderName, funderType, awardMin, awardMax, deadline,
    description, sourceUrl, applicationUrl, eligibilityTags = [],
    categoryTags = [], requiresLoi, coalitionPreferred, fitScore,
    scoreComponents, entityName, matchedAngles,
  } = data

  const deadlineDate = deadline ? new Date(deadline) : null

  const awardRange =
    awardMin != null && awardMax != null
      ? `${formatCurrency(awardMin)} – ${formatCurrency(awardMax)}`
      : awardMax != null
        ? `Up to ${formatCurrency(awardMax)}`
        : awardMin != null
          ? `From ${formatCurrency(awardMin)}`
          : null

  const allTags = [...new Set([...eligibilityTags, ...categoryTags])]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[480px] overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-4 pr-12">
          <SheetTitle className="text-sm font-semibold leading-snug">{title}</SheetTitle>
          {funderName && (
            <SheetDescription className="text-xs flex items-center gap-2 flex-wrap">
              <span>{funderName}</span>
              {funderType && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {FUNDER_TYPE_LABEL[funderType] ?? funderType}
                </span>
              )}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-5 pb-8">
          {/* Score + deadline + flags */}
          <div className="flex flex-wrap items-center gap-2">
            {fitScore != null && <ScoreBadge score={Math.round(fitScore)} />}
            {deadlineDate && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                  isUrgent(deadlineDate) ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                )}
              >
                <Calendar className="h-3 w-3" />
                {deadlineDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {formatDeadline(deadlineDate)}
              </span>
            )}
            {requiresLoi && (
              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                LOI Required
              </span>
            )}
            {coalitionPreferred && (
              <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                Coalition Preferred
              </span>
            )}
          </div>

          {scoreComponents && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Score Breakdown
              </span>
              <FitScoreBreakdown components={scoreComponents} />
            </div>
          )}

          {/* Award + entity */}
          {(awardRange || entityName) && (
            <div className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5">
              {awardRange && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-medium">{awardRange}</span>
                </div>
              )}
              {entityName && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{entityName}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </span>
            {description ? (
              <p className="text-xs leading-relaxed">{description}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No description available — view source for full details.
              </p>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Tags
              </span>
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matched angles */}
          {matchedAngles && matchedAngles.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Why We Match
              </span>
              <ul className="flex flex-col gap-1">
                {matchedAngles.map((angle, i) => (
                  <li key={i} className="text-xs flex gap-1.5">
                    <span className="text-muted-foreground mt-0.5">·</span>
                    <span>{angle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2 pt-1">
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-3 w-3" />
                {applicationUrl && applicationUrl !== sourceUrl ? 'View Source' : 'View / Apply'}
              </a>
            )}
            {applicationUrl && applicationUrl !== sourceUrl && (
              <a
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ExternalLink className="h-3 w-3" />
                Apply Now
              </a>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
