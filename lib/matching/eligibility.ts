import { differenceInCalendarDays } from 'date-fns'

// Patterns in grant titles that signal the grant requires specialized medical/clinical/academic
// credentials that none of the portfolio entities possess.
const MEDICAL_RESEARCH_PATTERNS = [
  /clinical trial/i,
  /clinical coordinating center/i,
  /\bclinical characterization\b/i,
  /national research service award/i,
  /neurotherapeutics/i,
  /brain initiative/i,
  /cancer (research|prevention|therapy)/i,
  /\boncol/i,
  /\bbiomarker/i,
  /\bgenomic variant/i,
  /\bproteomic/i,
  /\bbiospecimen/i,
  /drug discovery|drug development/i,
  /\bpharmacolog/i,
  /animal model/i,
  /investigator.initiated.*clinical/i,
  /dissemination and implementation research in health/i,
  /screening.*genomic/i,
  /computational.*curation.*biome/i,
  /\bhistolog/i,
  /\bpatholog/i,
  /physician|dentist scientist|nurse/i,
  /\bimaging.*science track\b/i,
  /biomedical imaging and bioengineering/i,
  /\btoxicolog/i,
  /substance abuse|drug abuse/i,
  /\bpsychiatric\b/i,
  /alcohol.*(health|research)/i,
  /mental health system inter/i,
  /\bgeriatric\b/i,
  /\bneurolog/i,
  /mind and body intervention/i,
  /translational science award/i,
  /bariatric/i,
  /\bdementia\b/i,
]

// Funder names that exclusively fund medical/clinical research not applicable to this portfolio
const MEDICAL_FUNDER_NAMES = [
  'national institutes of health',
  'national cancer institute',
  'national institute on',
  'national heart, lung',
  'national center for complementary',
  'national eye institute',
  'national institute of dental',
  'food and drug administration',
]

export type EligibilityInput = {
  grant: {
    id: string
    title?: string | null
    funder_name?: string | null
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
    is_healthcare_provider?: boolean | null
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

  // Reject medical/clinical research grants unless the entity is a healthcare provider.
  // These grants require specialized credentials (researcher, clinician, academic institution)
  // that standard small businesses don't have.
  if (!entity.is_healthcare_provider) {
    const title = (grant.title ?? '').toLowerCase()
    const funderLower = (grant.funder_name ?? '').toLowerCase()

    const isMedicalGrant =
      MEDICAL_RESEARCH_PATTERNS.some((re) => re.test(title)) ||
      MEDICAL_FUNDER_NAMES.some((name) => funderLower.includes(name))

    if (isMedicalGrant) {
      failures.push('requires_healthcare_credentials')
    }
  }

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

  // SAM registration is a soft note, not a hard block — federal grants still
  // enter the pipeline while registration is pending. Update sam_registered = true
  // on entities once SAM.gov approves to remove this note from future matches.

  // Women-owned grants: entity is not women-owned, so reject any grant that requires it
  const womenOnlyTags = ['women-owned', 'women_owned', 'women-led', 'women-business', 'women-founded']
  const requiresWomenOwned = grant.eligibility_tags.some((t) =>
    womenOnlyTags.includes(t.toLowerCase()),
  )
  if (requiresWomenOwned) {
    failures.push('requires_women_owned')
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
