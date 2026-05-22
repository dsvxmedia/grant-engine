export type BusinessEntity = {
  id: string
  name: string
  type: string
  industry?: string | null
  state?: string | null
  city?: string | null
  mission?: string | null
  focus_area?: string | null
  is_african_american_owned?: boolean | null
  is_minority_owned?: boolean | null
  is_underserved_community_tied?: boolean | null
  is_tech_company?: boolean | null
  is_social_enterprise?: boolean | null
  is_community_serving?: boolean | null
  pitch_angles_generated?: string[] | null
  uploaded_documents?: string[] | null
  parent_id?: string | null
}

export type FounderProfile = {
  id?: string
  owner_name?: string | null
  origin_story?: string | null
  personal_community_ties?: string | null
}

export type ImpactMetric = {
  id: string
  entity_id: string
  metric_name: string
  metric_value: number
  metric_unit?: string | null
  time_period?: string | null
  geography?: string | null
  source?: string | null
}

export type EligibilityValues = {
  is_african_american_owned: boolean
  is_minority_owned: boolean
  is_underserved_community_tied: boolean
  is_tech_company: boolean
  is_social_enterprise: boolean
  is_community_serving: boolean
}

export const ELIGIBILITY_FLAGS: { key: keyof EligibilityValues; label: string }[] = [
  { key: 'is_african_american_owned', label: 'African American Owned' },
  { key: 'is_minority_owned', label: 'Minority Owned' },
  { key: 'is_underserved_community_tied', label: 'Underserved Community Tied' },
  { key: 'is_tech_company', label: 'Tech Company' },
  { key: 'is_social_enterprise', label: 'Social Enterprise' },
  { key: 'is_community_serving', label: 'Community Serving' },
]
