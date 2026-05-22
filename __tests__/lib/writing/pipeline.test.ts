import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { researchGrant } from '@/lib/writing/research'
import { generateFirstDraft } from '@/lib/writing/passes/draft'
import { selfCritique } from '@/lib/writing/passes/critique'
import { reviseApplication } from '@/lib/writing/passes/revision'
import { humanizeApplication } from '@/lib/writing/passes/humanizer'
import { checkUniqueness } from '@/lib/writing/passes/uniqueness'
import { buildBudget } from '@/lib/writing/budget'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/writing/research', () => ({
  researchGrant: vi.fn(),
}))
vi.mock('@/lib/writing/passes/draft', () => ({
  generateFirstDraft: vi.fn(),
}))
vi.mock('@/lib/writing/passes/critique', () => ({
  selfCritique: vi.fn(),
}))
vi.mock('@/lib/writing/passes/revision', () => ({
  reviseApplication: vi.fn(),
}))
vi.mock('@/lib/writing/passes/humanizer', () => ({
  humanizeApplication: vi.fn(),
}))
vi.mock('@/lib/writing/passes/uniqueness', () => ({
  checkUniqueness: vi.fn(),
}))
vi.mock('@/lib/writing/budget', () => ({
  buildBudget: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedResearchGrant = vi.mocked(researchGrant)
const mockedGenerateFirstDraft = vi.mocked(generateFirstDraft)
const mockedSelfCritique = vi.mocked(selfCritique)
const mockedReviseApplication = vi.mocked(reviseApplication)
const mockedHumanizeApplication = vi.mocked(humanizeApplication)
const mockedCheckUniqueness = vi.mocked(checkUniqueness)
const mockedBuildBudget = vi.mocked(buildBudget)

// ─── Fixture factories ────────────────────────────────────────────────────────

const GRANT_MATCH_ID = 'match-111'
const GRANT_ID = 'grant-222'
const ENTITY_ID = 'entity-333'
const APPLICATION_ID = 'app-444'

function makeGrantMatch() {
  return {
    id: GRANT_MATCH_ID,
    grant_id: GRANT_ID,
    entity_id: ENTITY_ID,
    matched_angles: ['minority-owned', 'tech-company'],
    status: 'queued',
  }
}

function makeGrant() {
  return {
    id: GRANT_ID,
    title: 'Test Tech Grant',
    funder_name: 'Acme Foundation',
    funder_type: 'foundation',
    description: 'A grant for tech startups.',
    award_min: 25000,
    award_max: 75000,
    deadline: '2026-12-01',
    eligibility_tags: ['tech', 'minority-owned'],
    category_tags: ['technology'],
    eligibility_text: 'Must be minority-owned tech company.',
    source_url: null,
    application_url: null,
  }
}

function makeEntity() {
  return {
    id: ENTITY_ID,
    name: 'Test Tech Corp',
    mission: 'Empowering minority tech entrepreneurs.',
    focus_area: 'technology',
    who_we_serve: ['minority-owned businesses'],
    is_minority_owned: true,
    is_tech_company: true,
    is_social_enterprise: false,
    pitch_angles_generated: null,
  }
}

function makeFounderProfile() {
  return {
    id: 'founder-555',
    origin_story: 'I started this company because I saw a gap in the market.',
  }
}

function makeResearchFindings() {
  return {
    funderBackground: 'Acme Foundation has been funding tech innovation since 2010.',
    previousRecipients: ['Org A', 'Org B'],
    evaluationCriteria: ['Innovation', 'Impact', 'Feasibility'],
    requiredSections: ['Executive Summary', 'Project Description', 'Budget'],
    wordLimits: { 'Executive Summary': 300 },
    selectedFramework: 'theory-of-change' as const,
    funderLanguage: ['innovation ecosystem', 'catalytic impact'],
    rawNotes: 'Raw research notes.',
  }
}

function makeDraftOutput() {
  return {
    sections: [
      { name: 'Executive Summary', content: 'We do great work.', wordCount: 5 },
      { name: 'Project Description', content: 'We will build great things.', wordCount: 6 },
    ],
    rawText: '## Executive Summary\nWe do great work.\n## Project Description\nWe will build great things.',
    selectedAngles: ['minority-owned', 'tech-company'],
    selectedFramework: 'theory-of-change',
    researchNotes: JSON.stringify(makeResearchFindings()),
  }
}

function makeCritiqueOutput() {
  return {
    items: [
      {
        section: 'Executive Summary',
        issue: 'Lacks equity framing.',
        suggestion: 'Center the community being served.',
        severity: 'important' as const,
      },
    ],
    overallScore: 7,
    summary: 'Equity framing needs improvement.',
  }
}

function makeRevisionOutput() {
  return {
    sections: [
      { name: 'Executive Summary', content: 'We serve the community.', wordCount: 5 },
      { name: 'Project Description', content: 'Community-centered tech solutions.', wordCount: 4 },
    ],
    rawText: '## Executive Summary\nWe serve the community.\n## Project Description\nCommunity-centered tech solutions.',
    changesLog: ['Added equity framing to Executive Summary.'],
    selectedAngles: ['minority-owned', 'tech-company'],
    selectedFramework: 'theory-of-change',
    researchNotes: JSON.stringify(makeResearchFindings()),
  }
}

function makeHumanizerOutput() {
  return {
    sections: [
      { name: 'Executive Summary', content: 'Humanized summary.', wordCount: 2 },
      { name: 'Project Description', content: 'Humanized description.', wordCount: 2 },
    ],
    rawText: '## Executive Summary\nHumanized summary.\n## Project Description\nHumanized description.',
    changesLog: ['Humanized Executive Summary.'],
    selectedAngles: ['minority-owned', 'tech-company'],
    selectedFramework: 'theory-of-change',
    researchNotes: JSON.stringify(makeResearchFindings()),
    humanizerApplied: true,
  }
}

function makeUniquenessOutput(needsRevision = false, uniquenessScore = 0.95) {
  return {
    sections: makeHumanizerOutput().sections,
    rawText: makeHumanizerOutput().rawText,
    changesLog: makeHumanizerOutput().changesLog,
    selectedAngles: makeHumanizerOutput().selectedAngles,
    selectedFramework: makeHumanizerOutput().selectedFramework,
    researchNotes: makeHumanizerOutput().researchNotes,
    humanizerApplied: true,
    uniquenessScore,
    needsRevision,
  }
}

function makeBudgetOutput() {
  return {
    lineItems: [
      { category: 'Personnel', description: 'Program Director.', amount: 40000 },
      { category: 'Supplies', description: 'Materials.', amount: 10000 },
    ],
    totalAmount: 50000,
    indirectCosts: 10000,
    narrative: 'This budget supports our technology initiative.',
    csvRows: [
      ['Personnel', 'Program Director.', '40000'],
      ['Supplies', 'Materials.', '10000'],
    ],
  }
}

function makeSavedApplication() {
  return {
    id: APPLICATION_ID,
    grant_match_id: GRANT_MATCH_ID,
    entity_id: ENTITY_ID,
    grant_id: GRANT_ID,
    status: 'pending_review',
  }
}

// ─── Supabase mock builder ────────────────────────────────────────────────────

/**
 * Builds a Supabase client mock that routes by table name.
 * Supports:
 *  - .from(table).select(...).eq(...).maybeSingle()  → fetching single rows
 *  - .from(table).update(...).eq(...)               → updating status
 *  - .from(table).insert(...).select(...).single()   → inserting application
 */
function buildSupabaseMock({
  grantMatch,
  grant,
  entity,
  founderProfile,
  savedApplication,
  grantMatchNotFound = false,
}: {
  grantMatch?: ReturnType<typeof makeGrantMatch>
  grant?: ReturnType<typeof makeGrant>
  entity?: ReturnType<typeof makeEntity>
  founderProfile?: ReturnType<typeof makeFounderProfile> | null
  savedApplication?: ReturnType<typeof makeSavedApplication>
  grantMatchNotFound?: boolean
}) {
  // grant_matches fetch
  const grantMatchMaybeSingle = vi.fn().mockResolvedValue(
    grantMatchNotFound
      ? { data: null, error: null }
      : { data: grantMatch ?? makeGrantMatch(), error: null }
  )
  const grantMatchSelectEq = vi.fn().mockReturnValue({ maybeSingle: grantMatchMaybeSingle })
  const grantMatchSelect = vi.fn().mockReturnValue({ eq: grantMatchSelectEq })

  // grant_matches update (status → 'drafting')
  const grantMatchUpdateEqDrafting = vi.fn().mockResolvedValue({ error: null })
  const grantMatchUpdateDrafting = vi.fn().mockReturnValue({ eq: grantMatchUpdateEqDrafting })

  // grant_matches update (status → 'pending_review')
  const grantMatchUpdateEqPendingReview = vi.fn().mockResolvedValue({ error: null })
  const grantMatchUpdatePendingReview = vi.fn().mockReturnValue({ eq: grantMatchUpdateEqPendingReview })

  // grants fetch
  const grantMaybeSingle = vi.fn().mockResolvedValue({ data: grant ?? makeGrant(), error: null })
  const grantSelectEq = vi.fn().mockReturnValue({ maybeSingle: grantMaybeSingle })
  const grantSelect = vi.fn().mockReturnValue({ eq: grantSelectEq })

  // business_entities fetch
  const entityMaybeSingle = vi.fn().mockResolvedValue({ data: entity ?? makeEntity(), error: null })
  const entitySelectEq = vi.fn().mockReturnValue({ maybeSingle: entityMaybeSingle })
  const entitySelect = vi.fn().mockReturnValue({ eq: entitySelectEq })

  // founder_profile fetch
  const founderMaybeSingle = vi.fn().mockResolvedValue({
    data: founderProfile === undefined ? makeFounderProfile() : founderProfile,
    error: null,
  })
  const founderLimit = vi.fn().mockReturnValue({ maybeSingle: founderMaybeSingle })
  const founderOrder = vi.fn().mockReturnValue({ limit: founderLimit })
  const founderSelect = vi.fn().mockReturnValue({ order: founderOrder })

  // grant_applications insert
  const insertSingle = vi.fn().mockResolvedValue({
    data: savedApplication ?? makeSavedApplication(),
    error: null,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })

  // Stateful update call counter: first call → drafting, second → pending_review
  let updateCallCount = 0
  const grantMatchUpdate = vi.fn().mockImplementation(() => {
    updateCallCount++
    if (updateCallCount === 1) return { eq: grantMatchUpdateEqDrafting }
    return { eq: grantMatchUpdateEqPendingReview }
  })

  const from = vi.fn((table: string) => {
    if (table === 'grant_matches') {
      return {
        select: grantMatchSelect,
        update: grantMatchUpdate,
      }
    }
    if (table === 'grants') return { select: grantSelect }
    if (table === 'business_entities') return { select: entitySelect }
    if (table === 'founder_profile') return { select: founderSelect }
    if (table === 'grant_applications') return { insert }
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    client: { from } as any,
    spies: {
      from,
      grantMatchSelect,
      grantMatchUpdate,
      grantMatchUpdateEqDrafting,
      grantMatchUpdateEqPendingReview,
      insert,
    },
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()

  // Default happy-path mocks for all passes
  mockedResearchGrant.mockResolvedValue(makeResearchFindings())
  mockedGenerateFirstDraft.mockResolvedValue(makeDraftOutput())
  mockedSelfCritique.mockResolvedValue(makeCritiqueOutput())
  mockedReviseApplication.mockResolvedValue(makeRevisionOutput())
  mockedHumanizeApplication.mockResolvedValue(makeHumanizerOutput())
  mockedCheckUniqueness.mockResolvedValue(makeUniquenessOutput(false, 0.95))
  mockedBuildBudget.mockResolvedValue(makeBudgetOutput())
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runWritingPipeline', () => {
  describe('happy path — all passes run sequentially, no revision needed', () => {
    it('calls all 5 passes in correct order when uniqueness passes', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      expect(mockedResearchGrant).toHaveBeenCalledOnce()
      expect(mockedGenerateFirstDraft).toHaveBeenCalledOnce()
      expect(mockedSelfCritique).toHaveBeenCalledOnce()
      expect(mockedReviseApplication).toHaveBeenCalledOnce()
      expect(mockedHumanizeApplication).toHaveBeenCalledOnce()
      expect(mockedCheckUniqueness).toHaveBeenCalledOnce()
      expect(mockedBuildBudget).toHaveBeenCalledOnce()
    })

    it('returns applicationId, status pending_review, uniquenessScore, and needsRevision', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      const result = await runWritingPipeline(GRANT_MATCH_ID)

      expect(result.applicationId).toBe(APPLICATION_ID)
      expect(result.status).toBe('pending_review')
      expect(result.uniquenessScore).toBe(0.95)
      expect(result.needsRevision).toBe(false)
    })

    it('passes grant research into generateFirstDraft', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const passInput = mockedGenerateFirstDraft.mock.calls[0][0]
      expect(passInput.research).toEqual(makeResearchFindings())
    })

    it('passes matched_angles from grant_match into PassInput', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const passInput = mockedGenerateFirstDraft.mock.calls[0][0]
      expect(passInput.matchedAngles).toEqual(['minority-owned', 'tech-company'])
    })

    it('passes founderStory from founder_profile.origin_story into PassInput', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const passInput = mockedGenerateFirstDraft.mock.calls[0][0]
      expect(passInput.founderStory).toBe(makeFounderProfile().origin_story)
    })

    it('founderStory is null when founder_profile is not found', async () => {
      const { client } = buildSupabaseMock({ founderProfile: null })
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const passInput = mockedGenerateFirstDraft.mock.calls[0][0]
      expect(passInput.founderStory).toBeNull()
    })
  })

  describe('uniqueness retry — re-runs Pass 3 → 4 → 5 when needsRevision is true', () => {
    it('re-runs revise, humanize, and checkUniqueness once when first uniqueness check needs revision', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      // First uniqueness check fails (too similar), second passes
      mockedCheckUniqueness
        .mockResolvedValueOnce(makeUniquenessOutput(true, 0.05))  // needsRevision: true
        .mockResolvedValueOnce(makeUniquenessOutput(false, 0.92)) // needsRevision: false

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      const result = await runWritingPipeline(GRANT_MATCH_ID)

      // Pass 3 should be called twice (once initial, once retry)
      expect(mockedReviseApplication).toHaveBeenCalledTimes(2)
      // Pass 4 should be called twice
      expect(mockedHumanizeApplication).toHaveBeenCalledTimes(2)
      // Pass 5 should be called twice
      expect(mockedCheckUniqueness).toHaveBeenCalledTimes(2)

      // Final result uses second uniqueness output
      expect(result.uniquenessScore).toBe(0.92)
      expect(result.needsRevision).toBe(false)
    })

    it('uses retry result regardless when needsRevision is still true after retry', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      // Both uniqueness checks need revision
      mockedCheckUniqueness
        .mockResolvedValueOnce(makeUniquenessOutput(true, 0.05))  // needsRevision: true
        .mockResolvedValueOnce(makeUniquenessOutput(true, 0.10))  // still needsRevision

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      const result = await runWritingPipeline(GRANT_MATCH_ID)

      // Should not do a third retry — max one retry
      expect(mockedCheckUniqueness).toHaveBeenCalledTimes(2)
      // Still returns a result (not qa_failed)
      expect(result.applicationId).toBe(APPLICATION_ID)
      expect(result.needsRevision).toBe(true)
    })

    it('does not retry when uniqueness passes on first check', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      mockedCheckUniqueness.mockResolvedValueOnce(makeUniquenessOutput(false, 0.95))

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      expect(mockedReviseApplication).toHaveBeenCalledTimes(1)
      expect(mockedHumanizeApplication).toHaveBeenCalledTimes(1)
      expect(mockedCheckUniqueness).toHaveBeenCalledTimes(1)
    })
  })

  describe('saves application to grant_applications with correct fields', () => {
    it('inserts record with status pending_review', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      expect(spies.insert).toHaveBeenCalledOnce()
      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.status).toBe('pending_review')
    })

    it('inserts record with correct grant_match_id, entity_id, grant_id', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.grant_match_id).toBe(GRANT_MATCH_ID)
      expect(insertArg.entity_id).toBe(ENTITY_ID)
      expect(insertArg.grant_id).toBe(GRANT_ID)
    })

    it('inserts record with draft_content containing sections and budget', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.draft_content).toHaveProperty('sections')
      expect(insertArg.draft_content).toHaveProperty('budget')
    })

    it('inserts record with uniqueness_score from final pass', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)
      mockedCheckUniqueness.mockResolvedValue(makeUniquenessOutput(false, 0.88))

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.uniqueness_score).toBe(0.88)
    })

    it('inserts record with humanizer_applied flag', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.humanizer_applied).toBe(true)
    })

    it('inserts record with selected_angles from the final pass', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.selected_angles).toEqual(['minority-owned', 'tech-company'])
    })

    it('inserts record with deadline from grant', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      const insertArg = spies.insert.mock.calls[0][0]
      expect(insertArg.deadline).toBe('2026-12-01')
    })
  })

  describe('grant_matches status updates', () => {
    it('updates grant_match status to drafting before passes run', async () => {
      let draftingUpdateCalledBeforeFirstDraft = false

      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      // Track whether update was called before generateFirstDraft
      mockedGenerateFirstDraft.mockImplementationOnce(async (input) => {
        // Check if the update mock was already called
        draftingUpdateCalledBeforeFirstDraft = spies.grantMatchUpdate.mock.calls.length >= 1
        return makeDraftOutput()
      })

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      expect(draftingUpdateCalledBeforeFirstDraft).toBe(true)
    })

    it('updates grant_match status to pending_review after saving application', async () => {
      const { client, spies } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      // The update mock should have been called twice total
      expect(spies.grantMatchUpdate).toHaveBeenCalledTimes(2)

      // First call: status → 'drafting'
      const firstUpdateArg = spies.grantMatchUpdate.mock.calls[0][0]
      expect(firstUpdateArg).toHaveProperty('status', 'drafting')

      // Second call: status → 'pending_review'
      const secondUpdateArg = spies.grantMatchUpdate.mock.calls[1][0]
      expect(secondUpdateArg).toHaveProperty('status', 'pending_review')
    })
  })

  describe('error handling', () => {
    it('throws when grant match is not found in the database', async () => {
      const { client } = buildSupabaseMock({ grantMatchNotFound: true })
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')

      await expect(runWritingPipeline(GRANT_MATCH_ID)).rejects.toThrow()
    })

    it('logs error and re-throws when grant match fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const grantMatchMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB timeout' },
      })
      const grantMatchSelectEq = vi.fn().mockReturnValue({ maybeSingle: grantMatchMaybeSingle })
      const grantMatchSelect = vi.fn().mockReturnValue({ eq: grantMatchSelectEq })
      const from = vi.fn().mockReturnValue({ select: grantMatchSelect })
      mockedCreateServiceClient.mockResolvedValue({ from } as any)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')

      await expect(runWritingPipeline(GRANT_MATCH_ID)).rejects.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[pipeline]'),
        expect.anything(),
      )

      consoleSpy.mockRestore()
    })

    it('does not call any pass functions when grant match is not found', async () => {
      const { client } = buildSupabaseMock({ grantMatchNotFound: true })
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')

      await expect(runWritingPipeline(GRANT_MATCH_ID)).rejects.toThrow()

      expect(mockedResearchGrant).not.toHaveBeenCalled()
      expect(mockedGenerateFirstDraft).not.toHaveBeenCalled()
    })
  })

  describe('buildBudget receives correct parameters', () => {
    it('calls buildBudget with funderType, awardMin, awardMax, entityName, focusArea', async () => {
      const { client } = buildSupabaseMock({})
      mockedCreateServiceClient.mockResolvedValue(client)

      const { runWritingPipeline } = await import('@/lib/writing/pipeline')
      await runWritingPipeline(GRANT_MATCH_ID)

      expect(mockedBuildBudget).toHaveBeenCalledOnce()
      const budgetArg = mockedBuildBudget.mock.calls[0][0]
      expect(budgetArg.funderType).toBe('foundation')
      expect(budgetArg.awardMin).toBe(25000)
      expect(budgetArg.awardMax).toBe(75000)
      expect(budgetArg.entityName).toBe('Test Tech Corp')
      expect(budgetArg.focusArea).toBe('technology')
      expect(budgetArg.projectDurationMonths).toBe(12)
    })
  })
})
