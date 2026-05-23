import { createServiceClient } from '@/lib/supabase/server'
import { checkEligibility } from '@/lib/matching/eligibility'
import { computeFitScore } from '@/lib/matching/fit-score'
import {
  buildMatchRecord,
  persistMatches,
  type MatchRecord,
} from '@/lib/matching/persist'

export type RunMatchingResult = {
  grants_checked: number
  entities_checked: number
  pairs_evaluated: number
  pairs_passed_filter: number
  pairs_queued: number
  pairs_archived: number
  pairs_rejected: number
  persist_errors: number
}

const ENTITY_FLAG_TO_TAG: Array<{
  key:
    | 'is_african_american_owned'
    | 'is_minority_owned'
    | 'is_underserved_community_tied'
    | 'is_tech_company'
    | 'is_social_enterprise'
    | 'is_community_serving'
  tag: string
}> = [
  { key: 'is_african_american_owned', tag: 'african_american_owned' },
  { key: 'is_minority_owned', tag: 'minority_owned' },
  { key: 'is_underserved_community_tied', tag: 'underserved_community' },
  { key: 'is_tech_company', tag: 'tech_company' },
  { key: 'is_social_enterprise', tag: 'social_enterprise' },
  { key: 'is_community_serving', tag: 'community_serving' },
]

function entityEligibilityTags(entity: Record<string, unknown>): string[] {
  const tags: string[] = []
  for (const { key, tag } of ENTITY_FLAG_TO_TAG) {
    if (entity[key] === true) {
      tags.push(tag)
    }
  }
  return tags
}

function pairKey(grantId: string, entityId: string): string {
  return `${grantId}:${entityId}`
}

function emptyResult(
  grantsChecked: number,
  entitiesChecked: number,
): RunMatchingResult {
  return {
    grants_checked: grantsChecked,
    entities_checked: entitiesChecked,
    pairs_evaluated: 0,
    pairs_passed_filter: 0,
    pairs_queued: 0,
    pairs_archived: 0,
    pairs_rejected: 0,
    persist_errors: 0,
  }
}

export async function runMatching(): Promise<RunMatchingResult> {
  const supabase = await createServiceClient()

  const nowIso = new Date().toISOString()

  const { data: grants } = await (supabase as any)
    .from('grants')
    .select(
      'id, title, description, deadline, requires_loi, funder_type, geographic_restrictions, eligibility_tags, category_tags, award_min, award_max, is_new_program',
    )
    .eq('status', 'active')
    .or('deadline.is.null,deadline.gte.' + nowIso)

  const grantsList: any[] = Array.isArray(grants) ? grants : []
  if (grantsList.length === 0) {
    return emptyResult(0, 0)
  }

  const { data: entities } = await (supabase as any)
    .from('business_entities')
    .select(
      'id, type, state, city, revenue_range, sam_registered, sbir_eligible, mission, focus_area, pitch_angles_generated, who_we_serve, is_african_american_owned, is_minority_owned, is_underserved_community_tied, is_tech_company, is_social_enterprise, is_community_serving',
    )

  const entitiesList: any[] = Array.isArray(entities) ? entities : []
  if (entitiesList.length === 0) {
    return emptyResult(0, 0)
  }

  const { data: applied } = await (supabase as any)
    .from('grant_applications')
    .select('grant_id, entity_id')

  const appliedSet = new Set<string>(
    (Array.isArray(applied) ? applied : []).map((row: any) =>
      pairKey(row.grant_id, row.entity_id),
    ),
  )

  const { data: matched } = await (supabase as any)
    .from('grant_matches')
    .select('grant_id, entity_id')

  const matchedSet = new Set<string>(
    (Array.isArray(matched) ? matched : []).map((row: any) =>
      pairKey(row.grant_id, row.entity_id),
    ),
  )

  const records: MatchRecord[] = []
  let pairsEvaluated = 0
  let pairsPassedFilter = 0
  let pairsQueued = 0
  let pairsArchived = 0
  let pairsRejected = 0

  for (const grant of grantsList) {
    for (const entity of entitiesList) {
      const key = pairKey(grant.id, entity.id)
      if (appliedSet.has(key) || matchedSet.has(key)) {
        continue
      }

      pairsEvaluated += 1

      const eligibilityResult = checkEligibility({
        grant: {
          id: grant.id,
          deadline: grant.deadline,
          requires_loi: grant.requires_loi,
          funder_type: grant.funder_type,
          geographic_restrictions: grant.geographic_restrictions ?? {},
          eligibility_tags: grant.eligibility_tags ?? [],
          award_min: grant.award_min,
          award_max: grant.award_max,
        },
        entity: {
          id: entity.id,
          state: entity.state,
          city: entity.city,
          type: entity.type,
          is_african_american_owned: entity.is_african_american_owned,
          is_minority_owned: entity.is_minority_owned,
          is_underserved_community_tied: entity.is_underserved_community_tied,
          is_tech_company: entity.is_tech_company,
          is_social_enterprise: entity.is_social_enterprise,
          is_community_serving: entity.is_community_serving,
          sam_registered: entity.sam_registered,
          sbir_eligible: entity.sbir_eligible,
          revenue_range: entity.revenue_range,
        },
        alreadyApplied: false,
      })

      let fitScore: number | null = null
      let matchedAngles: string[] = []

      if (eligibilityResult.passed) {
        pairsPassedFilter += 1

        const tags = entityEligibilityTags(entity)
        const scoreResult = computeFitScore({
          grant: {
            funder_type: grant.funder_type,
            award_min: grant.award_min,
            award_max: grant.award_max,
            deadline: grant.deadline,
            eligibility_tags: grant.eligibility_tags ?? [],
            category_tags: grant.category_tags ?? [],
            is_new_program: grant.is_new_program ?? false,
            title: grant.title,
            description: grant.description,
          },
          entity: {
            mission: entity.mission,
            focus_area: entity.focus_area,
            pitch_angles_generated: entity.pitch_angles_generated,
            who_we_serve: entity.who_we_serve,
            revenue_range: entity.revenue_range,
            is_tech_company: entity.is_tech_company,
            is_social_enterprise: entity.is_social_enterprise,
            is_community_serving: entity.is_community_serving,
            // eligibility_tags is passed for downstream use by the scorer
            ...({ eligibility_tags: tags } as Record<string, unknown>),
          } as any,
        })

        fitScore = scoreResult.score
        matchedAngles = scoreResult.matchedAngles

        if (fitScore >= 70) {
          pairsQueued += 1
        } else {
          pairsArchived += 1
        }
      } else {
        pairsRejected += 1
      }

      records.push(
        buildMatchRecord({
          grant_id: grant.id,
          entity_id: entity.id,
          hard_filter_passed: eligibilityResult.passed,
          hard_filter_failures: eligibilityResult.failures,
          fit_score: fitScore,
          matched_angles: matchedAngles,
        }),
      )
    }
  }

  const persistResult = await persistMatches(records)

  return {
    grants_checked: grantsList.length,
    entities_checked: entitiesList.length,
    pairs_evaluated: pairsEvaluated,
    pairs_passed_filter: pairsPassedFilter,
    pairs_queued: pairsQueued,
    pairs_archived: pairsArchived,
    pairs_rejected: pairsRejected,
    persist_errors: persistResult.errors,
  }
}
