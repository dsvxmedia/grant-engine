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
    title: grant?.title ?? 'Untitled Grant',
    funderName: grant?.funder_name ?? null,
    awardMin: grant?.award_min ?? null,
    awardMax: grant?.award_max ?? null,
    deadline: grant?.deadline ?? null,
    fitScore: match.fit_score,
    entityName: match.business_entities?.name ?? null,
    status: match.status,
    isReviewable: false,
  }
}

function appToCard(app: ApplicationRecord, colId: string): KanbanCard {
  const grant = app.grants
  return {
    id: app.id,
    matchId: null,
    applicationId: app.id,
    title: grant?.title ?? 'Untitled Grant',
    funderName: grant?.funder_name ?? null,
    awardMin: grant?.award_min ?? null,
    awardMax: grant?.award_max ?? null,
    deadline: grant?.deadline ?? null,
    fitScore: app.fit_score ?? null,
    entityName: app.business_entities?.name ?? null,
    status: app.status,
    isReviewable: colId === 'review',
  }
}

function loiToCard(loi: LoiRecord): KanbanCard {
  const grant = loi.grants
  const deadline = grant?.loi_deadline ?? grant?.deadline ?? null
  return {
    id: `loi-${loi.id}`,
    matchId: null,
    applicationId: null,
    title: grant?.title ?? 'Untitled Grant',
    funderName: grant?.funder_name ?? null,
    awardMin: grant?.award_min ?? null,
    awardMax: grant?.award_max ?? null,
    deadline,
    fitScore: null,
    entityName: loi.business_entities?.name ?? null,
    status: loi.status,
    isReviewable: false,
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

  // Matched grants — top 50 by score, queued + pending_review
  const { data: matchesRaw } = await (supabase as any)
    .from('grant_matches')
    .select('*, grants(title, funder_name, award_min, award_max, deadline, source, funder_type), business_entities(id, name)')
    .in('status', ['queued', 'pending_review'])
    .order('fit_score', { ascending: false })
    .limit(50)

  const matches: MatchRecord[] = matchesRaw ?? []

  const { data: applicationsRaw } = await (supabase as any)
    .from('grant_applications')
    .select('*, grants(title, funder_name, award_min, award_max, deadline), business_entities(id, name)')
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

  const { count: pendingReviewCount } = await (supabase as any)
    .from('grant_matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review')

  const { count: queuedCount } = await (supabase as any)
    .from('grant_matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'queued')

  const columns: KanbanColumn[] = [
    { id: 'discovered', label: 'Discovered',  count: discoveredCount ?? 0, cards: [] },
    { id: 'loi',        label: 'LOI Queue',   count: 0,                   cards: [] },
    { id: 'matched',    label: 'Matched',     count: (pendingReviewCount ?? 0) + (queuedCount ?? 0), cards: [] },
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

  return (
    <div className="flex flex-col h-full">
      <Header title="Pipeline" />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard columns={columns} discoveredCount={discoveredCount ?? 0} />
      </div>
    </div>
  )
}
