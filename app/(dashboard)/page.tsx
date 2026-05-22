import { Header } from '@/components/layout/Header'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { createServiceClient } from '@/lib/supabase/server'
import type { KanbanColumn, KanbanCard, ApplicationRecord, LoiRecord } from '@/components/pipeline/types'

// Map application status to kanban column id
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

function appToCard(app: ApplicationRecord, colId: string): KanbanCard {
  const grant = app.grants
  return {
    id: app.id,
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

export default async function PipelinePage() {
  const supabase = await createServiceClient()

  // Fetch applications with joined grant + entity data
  const { data: applicationsRaw } = await (supabase as any)
    .from('grant_applications')
    .select('*, grants(title, funder_name, award_min, award_max, deadline), business_entities(id, name)')
    .order('deadline', { ascending: true, nullsFirst: false })

  const applications: ApplicationRecord[] = applicationsRaw ?? []

  // Fetch LOI submissions with joined grant + entity data
  const { data: loiRaw } = await (supabase as any)
    .from('loi_submissions')
    .select('*, grants(title, funder_name, award_min, award_max, loi_deadline, deadline), business_entities(id, name)')
    .in('status', ['draft', 'submitted'])
    .order('created_at', { ascending: false })

  const loiSubmissions: LoiRecord[] = loiRaw ?? []

  // Get discovered count from analytics
  const { count: discoveredCount } = await (supabase as any)
    .from('grants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Build empty column scaffolding
  const columns: KanbanColumn[] = [
    { id: 'discovered', label: 'Discovered', count: 0, cards: [] },
    { id: 'loi',        label: 'LOI Queue',  count: 0, cards: [] },
    { id: 'matched',    label: 'Matched',    count: 0, cards: [] },
    { id: 'qa_review',  label: 'QA Review',  count: 0, cards: [] },
    { id: 'review',     label: 'Review',     count: 0, cards: [] },
    { id: 'submitted',  label: 'Submitted',  count: 0, cards: [] },
  ]

  const colMap = new Map(columns.map((c) => [c.id, c]))

  // Populate LOI column
  for (const loi of loiSubmissions) {
    const col = colMap.get('loi')!
    col.cards.push(loiToCard(loi))
  }

  // Populate application columns
  for (const app of applications) {
    const colId = appStatusToColumn(app.status)
    if (!colId) continue
    const col = colMap.get(colId)
    if (!col) continue
    col.cards.push(appToCard(app, colId))
  }

  // Set counts
  for (const col of columns) {
    if (col.id !== 'discovered') {
      col.count = col.cards.length
    }
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
