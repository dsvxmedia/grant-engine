import { createServiceClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { formatCurrency, cn } from '@/lib/utils'
import { ExternalLink, Clock, CalendarDays, Infinity as InfinityIcon } from 'lucide-react'

type CalendarMatch = {
  id: string
  fit_score: number | null
  status: string
  grants: {
    id: string
    title: string
    funder_name: string | null
    funder_type: string | null
    award_min: number | null
    award_max: number | null
    deadline: string | null
    source_url: string | null
    application_url: string | null
    requires_loi: boolean | null
  } | null
  business_entities: { id: string; name: string } | null
}

const FUNDER_TYPE_LABEL: Record<string, string> = {
  federal: 'Federal', state: 'State', foundation: 'Foundation',
  corporate: 'Corporate', niche: 'Other',
}

function awardLabel(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${formatCurrency(min)} – ${formatCurrency(max)}`
  if (max != null) return `Up to ${formatCurrency(max)}`
  if (min != null) return `From ${formatCurrency(min)}`
  return null
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

function CalendarRow({ match }: { match: CalendarMatch }) {
  const grant = match.grants
  if (!grant) return null

  const award = awardLabel(grant.award_min, grant.award_max)
  const days = grant.deadline ? daysUntil(grant.deadline) : null
  const applyUrl = grant.application_url || grant.source_url

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="font-medium leading-snug line-clamp-2">{grant.title}</span>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {grant.funder_name && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {grant.funder_name}
            </span>
          )}
          {grant.funder_type && (
            <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
              {FUNDER_TYPE_LABEL[grant.funder_type] ?? grant.funder_type}
            </span>
          )}
          {grant.requires_loi && (
            <span className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
              LOI
            </span>
          )}
          {match.business_entities && (
            <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
              {match.business_entities.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {match.fit_score != null && <ScoreBadge score={Math.round(match.fit_score)} />}
          {days != null && (
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-muted-foreground'
              )}
            >
              {days}d
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {award && (
            <span className="text-xs text-muted-foreground">{award}</span>
          )}
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function CalendarPage() {
  const supabase = await createServiceClient()
  const now = new Date()

  const { data: raw } = await (supabase as any)
    .from('grant_matches')
    .select('id, fit_score, status, grants(id, title, funder_name, funder_type, award_min, award_max, deadline, source_url, application_url, requires_loi), business_entities(id, name)')
    .in('status', ['queued', 'pending_review'])
    .order('fit_score', { ascending: false })
    .limit(500)

  const matches: CalendarMatch[] = raw ?? []

  // Deduplicate by grant_id keeping highest fit_score
  const seen = new Map<string, CalendarMatch>()
  for (const m of matches) {
    const gid = m.grants?.id
    if (!gid) continue
    const existing = seen.get(gid)
    if (!existing || (m.fit_score ?? 0) > (existing.fit_score ?? 0)) {
      seen.set(gid, m)
    }
  }
  const unique = Array.from(seen.values())

  const upcoming = unique
    .filter((m) => m.grants?.deadline && new Date(m.grants.deadline) >= now)
    .sort((a, b) => new Date(a.grants!.deadline!).getTime() - new Date(b.grants!.deadline!).getTime())

  const rolling = unique
    .filter((m) => !m.grants?.deadline)
    .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0))

  const expired = unique.filter(
    (m) => m.grants?.deadline && new Date(m.grants.deadline) < now
  )

  // Group upcoming by month
  const byMonth = new Map<string, CalendarMatch[]>()
  for (const m of upcoming) {
    const d = new Date(m.grants!.deadline!)
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(m)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Grant Calendar" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl flex flex-col gap-8">

          {/* Summary strip */}
          <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {upcoming.length} with upcoming deadlines
            </span>
            <span className="flex items-center gap-1.5">
              <InfinityIcon className="h-3.5 w-3.5" />
              {rolling.length} rolling / always open
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {expired.length} with past deadlines
            </span>
          </div>

          {/* Upcoming deadlines grouped by month */}
          {byMonth.size > 0 ? (
            Array.from(byMonth.entries()).map(([month, monthMatches]) => (
              <section key={month}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold">{month}</h2>
                  <span className="text-xs text-muted-foreground">{monthMatches.length} grant{monthMatches.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {monthMatches.map((m) => (
                    <CalendarRow key={m.id} match={m} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section>
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No upcoming fixed deadlines</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Most matched grants are rolling — see the section below. As the system learns recurring grant cycles, predicted openings will appear here.
                </p>
              </div>
            </section>
          )}

          {/* Rolling / always open */}
          {rolling.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-sm font-semibold">Rolling / Always Open</h2>
                <span className="text-xs text-muted-foreground">{rolling.length} grants</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                No fixed deadline — apply anytime. Sorted by fit score.
              </p>
              <div className="flex flex-col gap-2">
                {rolling.slice(0, 60).map((m) => (
                  <CalendarRow key={m.id} match={m} />
                ))}
              </div>
              {rolling.length > 60 && (
                <p className="text-xs text-muted-foreground mt-3">
                  +{rolling.length - 60} more in Pipeline → Matched column.
                </p>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
