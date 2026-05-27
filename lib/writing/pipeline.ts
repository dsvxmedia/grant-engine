import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { researchGrant } from '@/lib/writing/research'
import { generateFirstDraft } from '@/lib/writing/passes/draft'
import { selfCritique } from '@/lib/writing/passes/critique'
import { reviseApplication } from '@/lib/writing/passes/revision'
import { humanizeApplication } from '@/lib/writing/passes/humanizer'
import { checkUniqueness } from '@/lib/writing/passes/uniqueness'
import { runQAGate } from '@/lib/writing/passes/qa-gate'
import { buildBudget } from '@/lib/writing/budget'
import type { PassInput } from '@/lib/writing/types'

// ─── Public types ─────────────────────────────────────────────────────────────

export type PipelineResult = {
  applicationId: string
  status: 'pending_review' | 'qa_failed'
  uniquenessScore: number
  needsRevision: boolean
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runWritingPipeline(grantMatchId: string): Promise<PipelineResult> {
  let supabase: Awaited<ReturnType<typeof createServiceClient>>

  try {
    supabase = await createServiceClient()
  } catch (err) {
    console.error('[pipeline] Failed to create Supabase client:', err)
    throw err
  }

  // ── Step 1: Fetch grant match ──────────────────────────────────────────────
  let grantMatch: {
    id: string
    grant_id: string
    entity_id: string
    matched_angles: string[]
    status: string
  }

  try {
    const { data, error } = await (supabase as any)
      .from('grant_matches')
      .select('*')
      .eq('id', grantMatchId)
      .maybeSingle()

    if (error) {
      throw new Error(`Supabase error fetching grant_match: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Grant match not found: ${grantMatchId}`)
    }

    grantMatch = data
  } catch (err) {
    console.error('[pipeline] Failed to fetch grant match:', err)
    throw err
  }

  // ── Step 2: Fetch grant ────────────────────────────────────────────────────
  let grant: {
    id: string
    title: string
    funder_name: string | null
    funder_type: string | null
    description: string | null
    award_min: number | null
    award_max: number | null
    deadline: string | null
    eligibility_tags: string[]
    category_tags: string[]
    eligibility_text: string | null
    source_url: string | null
    application_url: string | null
  }

  try {
    const { data, error } = await (supabase as any)
      .from('grants')
      .select('*')
      .eq('id', grantMatch.grant_id)
      .maybeSingle()

    if (error) {
      throw new Error(`Supabase error fetching grant: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Grant not found: ${grantMatch.grant_id}`)
    }

    grant = data
  } catch (err) {
    console.error('[pipeline] Failed to fetch grant:', err)
    throw err
  }

  // ── Step 3: Fetch business entity ──────────────────────────────────────────
  let entity: {
    id: string
    name: string
    mission: string | null
    focus_area: string | null
    who_we_serve: string[] | null
    is_minority_owned: boolean | null
    is_tech_company: boolean | null
    is_social_enterprise: boolean | null
    pitch_angles_generated: unknown
  }

  try {
    const { data, error } = await (supabase as any)
      .from('business_entities')
      .select('*')
      .eq('id', grantMatch.entity_id)
      .maybeSingle()

    if (error) {
      throw new Error(`Supabase error fetching entity: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Entity not found: ${grantMatch.entity_id}`)
    }

    entity = data
  } catch (err) {
    console.error('[pipeline] Failed to fetch entity:', err)
    throw err
  }

  // ── Step 4: Fetch founder profile (optional) ───────────────────────────────
  let founderStory: string | null = null

  try {
    const { data } = await (supabase as any)
      .from('founder_profile')
      .select('origin_story')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    founderStory = data?.origin_story ?? null
  } catch {
    // Founder profile is optional — proceed without it
  }

  // ── Step 5: Update grant_match status to 'drafting' ───────────────────────
  try {
    await (supabase as any)
      .from('grant_matches')
      .update({ status: 'drafting' })
      .eq('id', grantMatchId)
  } catch (err) {
    console.error('[pipeline] Failed to update grant_match to drafting:', err)
    throw err
  }

  // ── Step 6: Research ───────────────────────────────────────────────────────
  let research: Awaited<ReturnType<typeof researchGrant>>

  try {
    research = await researchGrant({ grant })
  } catch (err) {
    console.error('[pipeline] Research step failed:', err)
    throw err
  }

  // ── Step 7: Build PassInput ────────────────────────────────────────────────
  const passInput: PassInput = {
    grant: {
      title: grant.title,
      funder_name: grant.funder_name,
      funder_type: grant.funder_type,
      description: grant.description,
      award_min: grant.award_min,
      award_max: grant.award_max,
      deadline: grant.deadline,
      eligibility_tags: grant.eligibility_tags ?? [],
      category_tags: grant.category_tags ?? [],
    },
    entity: {
      name: entity.name,
      mission: entity.mission,
      focus_area: entity.focus_area,
      who_we_serve: entity.who_we_serve,
      is_minority_owned: entity.is_minority_owned,
      is_tech_company: entity.is_tech_company,
      is_social_enterprise: entity.is_social_enterprise,
      pitch_angles_generated: entity.pitch_angles_generated,
    },
    founderStory,
    research,
    matchedAngles: grantMatch.matched_angles ?? [],
  }

  // ── Pass 1: First draft ────────────────────────────────────────────────────
  let draft: Awaited<ReturnType<typeof generateFirstDraft>>

  try {
    draft = await generateFirstDraft(passInput)
  } catch (err) {
    console.error('[pipeline] Pass 1 (draft) failed:', err)
    throw err
  }

  // ── Pass 2: Self-critique ──────────────────────────────────────────────────
  let critique: Awaited<ReturnType<typeof selfCritique>>

  try {
    critique = await selfCritique(draft, passInput)
  } catch (err) {
    console.error('[pipeline] Pass 2 (critique) failed:', err)
    throw err
  }

  // ── Pass 3: Revision ───────────────────────────────────────────────────────
  let revision: Awaited<ReturnType<typeof reviseApplication>>

  try {
    revision = await reviseApplication(draft, critique, passInput)
  } catch (err) {
    console.error('[pipeline] Pass 3 (revision) failed:', err)
    throw err
  }

  // ── Pass 4: Humanizer ──────────────────────────────────────────────────────
  let humanized: Awaited<ReturnType<typeof humanizeApplication>>

  try {
    humanized = await humanizeApplication(revision, founderStory)
  } catch (err) {
    console.error('[pipeline] Pass 4 (humanizer) failed:', err)
    throw err
  }

  // ── Pass 5: Uniqueness check ───────────────────────────────────────────────
  let uniquenessResult: Awaited<ReturnType<typeof checkUniqueness>>

  try {
    uniquenessResult = await checkUniqueness(humanized)
  } catch (err) {
    console.error('[pipeline] Pass 5 (uniqueness) failed:', err)
    throw err
  }

  // ── Step 13: Retry Pass 3 → 4 → 5 if needed (max one retry) ──────────────
  if (uniquenessResult.needsRevision) {
    try {
      revision = await reviseApplication(draft, critique, passInput)
      humanized = await humanizeApplication(revision, founderStory)
      uniquenessResult = await checkUniqueness(humanized)
    } catch (err) {
      console.error('[pipeline] Retry passes (3→4→5) failed:', err)
      throw err
    }
  }

  // The final output carries through from uniqueness check
  const final = uniquenessResult

  // ── Step 14: Build budget ──────────────────────────────────────────────────
  let budgetOutput: Awaited<ReturnType<typeof buildBudget>>

  try {
    budgetOutput = await buildBudget({
      funderType: grant.funder_type,
      awardMin: grant.award_min,
      awardMax: grant.award_max,
      projectDurationMonths: 12,
      entityName: entity.name,
      focusArea: entity.focus_area,
    })
  } catch (err) {
    console.error('[pipeline] Budget step failed:', err)
    throw err
  }

  // ── Step 15: Save draft immediately — QA runs as an update after ───────────
  // Saving first guarantees the draft is persisted even if QA times out.
  // The QA gate then updates qa_scores and status in-place.
  let savedApplication: { id: string }

  try {
    const insertPayload = {
      grant_match_id: grantMatchId,
      entity_id: grantMatch.entity_id,
      grant_id: grantMatch.grant_id,
      draft_content: {
        sections: final.sections,
        budget: budgetOutput,
      },
      research_notes: (() => {
        try {
          return JSON.parse(final.researchNotes)
        } catch {
          return {}
        }
      })(),
      selected_angles: final.selectedAngles,
      selected_framework: final.selectedFramework,
      humanizer_applied: final.humanizerApplied,
      uniqueness_score: final.uniquenessScore,
      qa_scores: {},
      qa_passed: null,
      qa_retry_count: 0,
      status: 'pending_review',
      deadline: grant.deadline,
    }

    const { data, error } = await (supabase as any)
      .from('grant_applications')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      throw new Error(`Supabase error saving application: ${error.message}`)
    }

    savedApplication = data

    // Update match status so it moves out of 'drafting'
    await (supabase as any)
      .from('grant_matches')
      .update({ status: 'pending_review' })
      .eq('id', grantMatchId)
  } catch (err) {
    console.error('[pipeline] Failed to save grant application:', err)
    throw err
  }

  // ── Step 16: QA Gate — 3-model council review ─────────────────────────────
  // Runs after save so a timeout here doesn't lose the draft.
  // Threshold: narrative ≥ 7.0, clarity ≥ 7.0, compliance ≥ 7.0
  let qaRetryCount = 0
  try {
    let qaFinal = final
    let qaResult = await runQAGate(qaFinal, passInput)

    while (!qaResult.passed && qaRetryCount < 2) {
      qaRetryCount++
      console.log(`[pipeline] QA gate failed (attempt ${qaRetryCount}/2) — revising`)
      const qaCritique = { ...critique, summary: `QA feedback:\n${qaResult.feedback.join('\n')}` }
      const qaRevision = await reviseApplication(draft, qaCritique, passInput)
      const qaHumanized = await humanizeApplication(qaRevision, founderStory)
      qaFinal = await checkUniqueness(qaHumanized)
      qaResult = await runQAGate(qaFinal, passInput)
    }

    const applicationStatus = qaResult.passed ? 'pending_review' : 'qa_failed'

    await (supabase as any)
      .from('grant_applications')
      .update({
        qa_scores: qaResult.scores,
        qa_passed: qaResult.passed,
        qa_retry_count: qaRetryCount,
        status: applicationStatus,
        // If QA improved the draft, update the content too
        ...(qaRetryCount > 0 && {
          draft_content: { sections: qaFinal.sections, budget: budgetOutput },
          humanizer_applied: qaFinal.humanizerApplied,
          uniqueness_score: qaFinal.uniquenessScore,
        }),
      })
      .eq('id', savedApplication.id)

    await (supabase as any)
      .from('grant_matches')
      .update({ status: applicationStatus })
      .eq('id', grantMatchId)

    return {
      applicationId: savedApplication.id,
      status: applicationStatus,
      uniquenessScore: qaFinal.uniquenessScore,
      needsRevision: qaFinal.needsRevision,
    }
  } catch (err) {
    // QA failed entirely — application is still saved and visible for review
    console.error('[pipeline] QA gate error (draft already saved):', err)
    return {
      applicationId: savedApplication.id,
      status: 'pending_review',
      uniquenessScore: final.uniquenessScore,
      needsRevision: final.needsRevision,
    }
  }
}
