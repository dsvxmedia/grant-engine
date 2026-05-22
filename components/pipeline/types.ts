export type GrantInfo = {
  title: string
  funder_name: string | null
  award_min: number | null
  award_max: number | null
  deadline: string | null
}

export type EntityInfo = {
  id: string
  name: string
}

export type ApplicationRecord = {
  id: string
  grant_id: string
  entity_id: string
  status: string
  fit_score: number | null
  qa_passed: boolean | null
  qa_scores: Record<string, number> | null
  draft_content: Record<string, unknown> | null
  created_at: string
  updated_at: string
  grants: GrantInfo | null
  business_entities: EntityInfo | null
}

export type LoiRecord = {
  id: string
  grant_id: string
  entity_id: string | null
  status: string
  created_at: string
  grants: (GrantInfo & { loi_deadline?: string | null }) | null
  business_entities: EntityInfo | null
}

export type KanbanColumn = {
  id: string
  label: string
  count: number
  cards: KanbanCard[]
}

export type KanbanCard = {
  id: string
  applicationId: string | null
  title: string
  funderName: string | null
  awardMin: number | null
  awardMax: number | null
  deadline: string | null
  fitScore: number | null
  entityName: string | null
  status: string
  isReviewable: boolean
}
