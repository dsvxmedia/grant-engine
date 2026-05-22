export type FunderType = 'federal' | 'state' | 'foundation' | 'corporate' | 'niche'

export type RawGrant = {
  source: string
  sourceUrl?: string
  applicationUrl?: string
  title: string
  description?: string
  funderName?: string
  funderType?: FunderType
  awardMin?: number
  awardMax?: number
  deadline?: string
  eligibilityText?: string
  categoryTags?: string[]
  eligibilityTags?: string[]
  geographicRestrictions?: Record<string, unknown>
  requiresLoi?: boolean
  loiDeadline?: string
  requiresVideo?: boolean
  coalitionPreferred?: boolean
  competitionEstimate?: number
  isNewProgram?: boolean
}

export type NormalizedGrant = {
  source: string
  source_url: string | null
  application_url: string | null
  title: string
  description: string | null
  funder_name: string | null
  funder_type: FunderType | null
  award_min: number | null
  award_max: number | null
  deadline: string | null
  eligibility_text: string | null
  eligibility_tags: string[]
  category_tags: string[]
  geographic_restrictions: Record<string, unknown>
  requires_loi: boolean
  loi_deadline: string | null
  requires_video: boolean
  coalition_preferred: boolean
  competition_estimate: number | null
  is_new_program: boolean
  content_hash: string
  status: 'active'
}
