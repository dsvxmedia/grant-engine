export type GrantInfo = {
  title: string
  funder_name: string | null
  award_min: number | null
  award_max: number | null
  deadline: string | null
  source?: string | null
  funder_type?: string | null
  description?: string | null
  source_url?: string | null
  application_url?: string | null
  eligibility_tags?: string[] | null
  category_tags?: string[] | null
  requires_loi?: boolean | null
  coalition_preferred?: boolean | null
}

export type EntityInfo = {
  id: string
  name: string
}

export type ScoreComponents = {
  missionAlignment: number
  angleMatch: number
  awardSizeFit: number
  deadlineUrgency: number
  funderPrestige: number
}

export type MatchRecord = {
  id: string
  grant_id: string
  entity_id: string
  status: string
  fit_score: number | null
  hard_filter_passed: boolean
  matched_angles: string[] | null
  score_components: ScoreComponents | null
  created_at: string
  grants: GrantInfo | null
  business_entities: EntityInfo | null
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
  matchId: string | null
  applicationId: string | null
  grantId: string | null
  title: string
  funderName: string | null
  funderType: string | null
  awardMin: number | null
  awardMax: number | null
  deadline: string | null
  fitScore: number | null
  scoreComponents: ScoreComponents | null
  entityName: string | null
  status: string
  isReviewable: boolean
  description: string | null
  sourceUrl: string | null
  applicationUrl: string | null
  eligibilityTags: string[]
  categoryTags: string[]
  requiresLoi: boolean
  matchedAngles: string[] | null
}
