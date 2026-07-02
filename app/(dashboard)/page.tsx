import { Header } from '@/components/layout/Header'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { createServiceClient } from '@/lib/supabase/server'
import type { KanbanColumn, KanbanCard, ApplicationRecord, LoiRecord, MatchRecord } from '@/components/pipeline/types'

function matchToCard(match: MatchRecord): KanbanCard {
  const grant = match.grants
  return {
    id: `match-${match.id}`,
    matchId: match.id,
    applicationId: null,
    grantId: match.grant_id,
    title: grant?.title ?? 'Untitled Grant',
    funderName: grant?.funder_name ?? null,
    funderType: grant?.funder_type ?? null,
    awardMin: grant?.award_min ?? null,
    awardMax: grant?.award_max ?? null,
    deadline: grant?.deadline ?? null,
    fitScore: match.fit_score,
    scoreComponents: match.score_components ?? null,
    entityName: match.business_entities?.name ?? null,
    status: match.status,
    isReviewable: false,
    description: grant?.description ?? null,
    sourceUrl: grant?.source_url ?? null,
    applicationUrl: grant?.application_url ?? null,
    eligibilityTags: grant?.eligibility_tags ?? [],
    categoryTags: grant?.category_tags ?? [],
    requiresLoi: grant?.requires_loi ?? false,
    matchedAngles: match.matched_angles ?? null,
  }
}

function appToCard(app: ApplicationRecord, colId: string): KanbanCard {
  const grant = app.grants
  return {
    id: app.id,
    matchId: null,
    applicationId: app.id,
    grantId: app.grant_id,
    title: grant?.title ?? 'Untitled Grant',
    funderName: grant?.funder_name ?? null,
    funderType: grant?.funder_type ?? null,
    awardMin: grant?.award_min ?? null,
    awardMax: grant?.award_max ?? null,
    deadline: grant?.deadline ?? null,
    fitScore: app.fit_score ?? null,
    scoreComponents: null,
    entityName: app.business_entities?.name ?? null,
    status: app.status,
    isReviewable: colId === 'review',
    description: grant?.description ?? null,
    sourceUrl: grant?.source_url ?? null,
    applicationUrl: grant?.application_url ?? null,
    eligibilityTags: grant?.eligibility_tags ?? [],
    categoryTags: grant?.category_tags ?? [],
    requiresLoi: grant?.requires_loi ?? false,
    matchedAngles: null,
  }
}

function loiToCard(loi: LoiRecord): KanbanCard {
  const grant = loi.grants
  const deadline = grant?.loi_deadline ?? grant?.deadline ?? null
  return {
    id: `loi-${loi.id}`,
    matchId: null,
    applicationId: null,
    grantId: loi.grant_id,
    title: grant?.title ?? 'Untitled Grant',
    funderName: grant?.funder_name ?? null,
    funderType: grant?.funder_type ?? null,
    awardMin: grant?.award_min ?? null,
    awardMax: grant?.award_max ?? null,
    deadline,
    fitScore: null,
    scoreComponents: null,
    entityName: loi.business_entities?.name ?? null,
    status: loi.status,
    isReviewable: false,
    description: grant?.description ?? null,
    sourceUrl: grant?.source_url ?? null,
    applicationUrl: grant?.application_url ?? null,
    eligibilityTags: grant?.eligibility_tags ?? [],
    categoryTags: grant?.category_tags ?? [],
    requiresLoi: grant?.requires_loi ?? false,
    matchedAngles: null,
  }
}

function appStatusToColumn(status: string): string | null {
  switch (status) {
    case 'drafting':
    case 'qa_review':
    case 'qa_failed':
      return 'qa_review'
    case 'pending_review':
      return 'review'
    case 'submitted':
    case 'approved':
      return 'submitted'
    default:
      return null
  }
}

export default async function PipelinePage() {
  const supabase = await createServiceClient()

  // Matched grants — deduplicated by grant_id so each grant appears once on the board
  const { data: matchesRaw } = await (supabase as any)
    .from('grant_matches')
    .select('*, score_components, grants(title, funder_name, funder_type, award_min, award_max, deadline, source, source_url, application_url, description, eligibility_tags, category_tags, requires_loi, coalition_preferred), business_entities(id, name)')
    .in('status', ['queued', 'pending_review'])
    .order('fit_score', { ascending: false })
    .limit(200)

  // Keep highest-scoring match per grant so each grant appears once on the Kanban board
  const seenOnBoard = new Set<string>()
  const matches: MatchRecord[] = []
  for (const m of (matchesRaw ?? []) as MatchRecord[]) {
    if (!m.grant_id || seenOnBoard.has(m.grant_id)) continue
    seenOnBoard.add(m.grant_id)
    matches.push(m)
    if (matches.length >= 50) break
  }

  const { data: applicationsRaw } = await (supabase as any)
    .from('grant_applications')
    .select('*, grants(title, funder_name, funder_type, award_min, award_max, deadline, source_url, application_url, description, eligibility_tags, category_tags, requires_loi), business_entities(id, name)')
    .order('deadline', { ascending: true, nullsFirst: false })

  const applications: ApplicationRecord[] = applicationsRaw ?? []

  const { data: loiRaw } = await (supabase as any)
    .from('loi_submissions')
    .select('*, grants(title, funder_name, award_min, award_max, loi_deadline, deadline), business_entities(id, name)')
    .in('status', ['draft', 'submitted'])
    .order('created_at', { ascending: false })

  const loiSubmissions: LoiRecord[] = loiRaw ?? []

  const { count: discoveredCount } = await (supabase as any)
    .from('grants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const columns: KanbanColumn[] = [
    { id: 'discovered', label: 'Discovered',  count: discoveredCount ?? 0, cards: [] },
    { id: 'loi',        label: 'LOI Queue',   count: 0,                   cards: [] },
    // Count = unique grants on the board (deduped), not raw match records
    { id: 'matched',    label: 'Matched',     count: seenOnBoard.size,     cards: [] },
    { id: 'qa_review',  label: 'QA Review',   count: 0,                   cards: [] },
    { id: 'review',     label: 'Review',      count: 0,                   cards: [] },
    { id: 'submitted',  label: 'Submitted',   count: 0,                   cards: [] },
  ]

  const colMap = new Map(columns.map((c) => [c.id, c]))

  for (const match of matches) {
    colMap.get('matched')!.cards.push(matchToCard(match))
  }

  for (const loi of loiSubmissions) {
    colMap.get('loi')!.cards.push(loiToCard(loi))
  }
  colMap.get('loi')!.count = loiSubmissions.length

  for (const app of applications) {
    const colId = appStatusToColumn(app.status)
    if (!colId) continue
    const col = colMap.get(colId)
    if (!col) continue
    col.cards.push(appToCard(app, colId))
  }

  for (const id of ['qa_review', 'review', 'submitted']) {
    const col = colMap.get(id)!
    col.count = col.cards.length
  }

  const reviewCount = colMap.get('review')!.count
  const submittedCount = colMap.get('submitted')!.count

  const kpis = [
    { label: 'Discovered',      value: discoveredCount ?? 0, sub: 'Active grants' },
    { label: 'Matched',         value: seenOnBoard.size,     sub: 'Scored & queued' },
    { label: 'Awaiting Review', value: reviewCount,          sub: 'Need approval' },
    { label: 'Submitted',       value: submittedCount,       sub: 'In pipeline' },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Pipeline" />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 px-6 pt-4 pb-1 shrink-0">
        {kpis.map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard columns={columns} discoveredCount={discoveredCount ?? 0} />
      </div>
    </div>
  )
}
