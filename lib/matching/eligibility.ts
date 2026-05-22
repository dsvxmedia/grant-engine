import { differenceInCalendarDays } from 'date-fns'

export type EligibilityInput = {
  grant: {
    id: string
    deadline: string | null
    requires_loi: boolean
    funder_type: string | null
    geographic_restrictions: Record<string, unknown>
    eligibility_tags: string[]
    award_min: number | null
    award_max: number | null
  }
  entity: {
    id: string
    state: string | null
    city: string | null
    type: string
    is_african_american_owned: boolean | null
    is_minority_owned: boolean | null
    is_underserved_community_tied: boolean | null
    is_tech_company: boolean | null
    is_social_enterprise: boolean | null
    is_community_serving: boolean | null
    sam_registered: boolean | null
    sbir_eligible: boolean | null
    revenue_range: string | null
  }
  alreadyApplied: boolean
}

export type EligibilityResult = {
  passed: boolean
  failures: string[]
}

const REVENUE_RANGE_MAX_AWARD: Record<string, number | null> = {
  under_100k: 50_000,
  '100k_500k': 250_000,
  '500k_1m': 500_000,
  '1m_5m': 2_000_000,
  '5m_plus': null,
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const failures: string[] = []
  const { grant, entity, alreadyApplied } = input

  if (grant.deadline !== null) {
    const deadlineDate = new Date(grant.deadline)
    const daysUntilDeadline = differenceInCalendarDays(deadlineDate, new Date())

    if (daysUntilDeadline < 0) {
      failures.push('deadline_passed')
    } else if (grant.requires_loi) {
      if (daysUntilDeadline < 14) {
        failures.push('deadline_too_close_for_loi')
      }
    } else if (daysUntilDeadline < 7) {
      failures.push('deadline_too_close')
    }
  }

  if (alreadyApplied) {
    failures.push('already_applied')
  }

  if (grant.funder_type === 'federal' && entity.sam_registered !== true) {
    failures.push('sam_registration_required')
  }

  const statesValue = grant.geographic_restrictions?.states
  if (Array.isArray(statesValue) && statesValue.length > 0) {
    if (entity.state === null || !statesValue.includes(entity.state)) {
      failures.push('geographic_restriction')
    }
  }

  if (
    grant.award_min !== null &&
    grant.award_max !== null &&
    entity.revenue_range !== null &&
    entity.revenue_range in REVENUE_RANGE_MAX_AWARD
  ) {
    const maxReasonable = REVENUE_RANGE_MAX_AWARD[entity.revenue_range]
    if (maxReasonable !== null && grant.award_min > maxReasonable) {
      failures.push('award_too_large_for_entity')
    }
  }

  return { passed: failures.length === 0, failures }
}
