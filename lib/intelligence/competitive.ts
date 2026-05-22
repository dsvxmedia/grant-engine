import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type CompetitiveDensity = {
  grantId: string
  estimatedApplicants: number | null
  profileRarityScore: number
  priorityBoost: number
  isNewProgram: boolean
}

// Fraction of typical applicants matching each eligibility flag
const RARITY_TABLE: Record<string, number> = {
  minority_owned: 0.15,
  african_american_owned: 0.08,
  sbir_eligible: 0.20,
  tech_company: 0.25,
}

function computeRarity(eligibilityTags: string[]): number {
  const matchedTags = eligibilityTags.filter((tag) => tag in RARITY_TABLE)
  if (matchedTags.length === 0) return 0

  // Rarity = 1 - product of matched fractions
  const product = matchedTags.reduce((acc, tag) => acc * RARITY_TABLE[tag], 1)
  return 1 - product
}

function computePriorityBoost(
  isNewProgram: boolean,
  estimatedApplicants: number | null
): number {
  if (isNewProgram) return 0.3
  if (estimatedApplicants !== null && estimatedApplicants < 50) return 0.2
  if (estimatedApplicants !== null && estimatedApplicants > 1000) return -0.2
  return 0.0
}

export async function scoreCompetitiveDensity(
  grantId: string,
  entityId: string
): Promise<CompetitiveDensity> {
  const defaultResult: CompetitiveDensity = {
    grantId,
    estimatedApplicants: null,
    profileRarityScore: 0,
    priorityBoost: 0,
    isNewProgram: false,
  }

  try {
    const supabase = await createServiceClient()

    const [grantResult, entityResult] = await Promise.all([
      (supabase as any)
        .from('grants')
        .select('id, is_new_program, competition_estimate, eligibility_tags')
        .eq('id', grantId)
        .maybeSingle(),
      (supabase as any)
        .from('business_entities')
        .select('id, is_minority_owned, is_african_american_owned, is_tech_company, eligibility_tags')
        .eq('id', entityId)
        .maybeSingle(),
    ])

    if (grantResult.error) console.error('[competitive] grant fetch error:', grantResult.error)
    if (entityResult.error) console.error('[competitive] entity fetch error:', entityResult.error)

    const grant = grantResult.data
    const entity = entityResult.data

    if (!grant) return defaultResult

    const isNewProgram: boolean = grant.is_new_program ?? false
    const estimatedApplicants: number | null = grant.competition_estimate ?? null

    // Build entity eligibility tags from flags + explicit tags
    const entityTags: string[] = []
    if (entity) {
      if (entity.is_minority_owned) entityTags.push('minority_owned')
      if (entity.is_african_american_owned) entityTags.push('african_american_owned')
      if (entity.is_tech_company) entityTags.push('tech_company')
      if (Array.isArray(entity.eligibility_tags)) {
        for (const tag of entity.eligibility_tags) {
          if (!entityTags.includes(tag)) entityTags.push(tag)
        }
      }
    }

    const profileRarityScore = computeRarity(entityTags)
    const priorityBoost = computePriorityBoost(isNewProgram, estimatedApplicants)

    return {
      grantId,
      estimatedApplicants,
      profileRarityScore,
      priorityBoost,
      isNewProgram,
    }
  } catch (err) {
    console.error('[competitive] unexpected error:', err)
    return defaultResult
  }
}
