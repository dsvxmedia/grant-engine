import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { checkEligibility } from '@/lib/matching/eligibility'
import { computeFitScore } from '@/lib/matching/fit-score'
import { buildMatchRecord, persistMatches } from '@/lib/matching/persist'
import { runMatching } from '@/lib/matching'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/matching/eligibility', () => ({
  checkEligibility: vi.fn(),
}))
vi.mock('@/lib/matching/fit-score', () => ({
  computeFitScore: vi.fn(),
}))
vi.mock('@/lib/matching/persist', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/matching/persist')>(
      '@/lib/matching/persist',
    )
  return {
    ...actual,
    persistMatches: vi.fn(),
  }
})
vi.mock('server-only', () => ({}))

function makeGrant(id: string) {
  return {
    id,
    title: `Grant ${id}`,
    deadline: null,
    requires_loi: false,
    funder_type: 'foundation',
    geographic_restrictions: {},
    eligibility_tags: [],
    category_tags: [],
    award_min: null,
    award_max: null,
    is_new_program: false,
  }
}

function makeEntity(id: string) {
  return {
    id,
    type: 'llc',
    state: 'GA',
    city: null,
    revenue_range: '100k_500k',
    sam_registered: true,
    sbir_eligible: false,
    mission: 'test mission',
    focus_area: null,
    pitch_angles_generated: [],
    who_we_serve: null,
    is_african_american_owned: false,
    is_minority_owned: false,
    is_underserved_community_tied: false,
    is_tech_company: true,
    is_social_enterprise: false,
    is_community_serving: false,
  }
}

function setupSupabaseMock(overrides?: {
  grants?: any[]
  entities?: any[]
  applied?: any[]
  matched?: any[]
}) {
  const data: Record<string, any[]> = {
    grants: overrides?.grants ?? [],
    business_entities: overrides?.entities ?? [],
    grant_applications: overrides?.applied ?? [],
    grant_matches: overrides?.matched ?? [],
  }
  const makeChain = (result: any[]) => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      or: () => chain,
      then: (resolve: any) => resolve({ data: result, error: null }),
    }
    return chain
  }
  vi.mocked(createServiceClient).mockResolvedValue({
    from: (table: string) => makeChain(data[table] ?? []),
  } as any)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(persistMatches).mockResolvedValue({ upserted: 0, errors: 0 })
})

describe('runMatching', () => {
  it('returns zeros when no grants', async () => {
    setupSupabaseMock({ grants: [], entities: [makeEntity('e1')] })
    const result = await runMatching()
    expect(result).toEqual({
      grants_checked: 0,
      entities_checked: 0,
      pairs_evaluated: 0,
      pairs_passed_filter: 0,
      pairs_queued: 0,
      pairs_pending_review: 0,
      pairs_archived: 0,
      pairs_rejected: 0,
      persist_errors: 0,
    })
  })

  it('returns zeros when no entities', async () => {
    setupSupabaseMock({ grants: [makeGrant('g1')], entities: [] })
    const result = await runMatching()
    expect(result.grants_checked).toBe(0)
    expect(result.entities_checked).toBe(0)
    expect(result.pairs_evaluated).toBe(0)
    expect(result.pairs_queued).toBe(0)
    expect(result.pairs_pending_review).toBe(0)
    expect(result.pairs_archived).toBe(0)
    expect(result.pairs_rejected).toBe(0)
  })

  it('calls eligibility filter for each pair', async () => {
    setupSupabaseMock({
      grants: [makeGrant('g1'), makeGrant('g2')],
      entities: [makeEntity('e1'), makeEntity('e2')],
    })
    vi.mocked(checkEligibility).mockReturnValue({ passed: true, failures: [] })
    vi.mocked(computeFitScore).mockReturnValue({
      score: 75,
      components: {
        missionAlignment: 0.5,
        angleMatch: 0.5,
        awardSizeFit: 0.5,
        deadlineUrgency: 0.5,
        funderPrestige: 0.5,
        winLoss: 0,
      },
      matchedAngles: [],
    })
    vi.mocked(persistMatches).mockResolvedValue({ upserted: 4, errors: 0 })

    const result = await runMatching()
    expect(checkEligibility).toHaveBeenCalledTimes(4)
    expect(result.pairs_evaluated).toBe(4)
    expect(result.pairs_passed_filter).toBe(4)
    expect(result.pairs_queued).toBe(4)
  })

  it('skips fit scoring when eligibility fails', async () => {
    setupSupabaseMock({
      grants: [makeGrant('g1')],
      entities: [makeEntity('e1')],
    })
    vi.mocked(checkEligibility).mockReturnValue({
      passed: false,
      failures: ['deadline_passed'],
    })

    const result = await runMatching()
    expect(checkEligibility).toHaveBeenCalledTimes(1)
    expect(computeFitScore).not.toHaveBeenCalled()
    expect(result.pairs_rejected).toBe(1)
    expect(result.pairs_passed_filter).toBe(0)
  })

  it('skips already-applied pairs', async () => {
    setupSupabaseMock({
      grants: [makeGrant('g1')],
      entities: [makeEntity('e1')],
      applied: [{ grant_id: 'g1', entity_id: 'e1' }],
    })

    const result = await runMatching()
    expect(checkEligibility).not.toHaveBeenCalled()
    expect(computeFitScore).not.toHaveBeenCalled()
    expect(result.pairs_evaluated).toBe(0)
  })

  it('skips already-matched pairs', async () => {
    setupSupabaseMock({
      grants: [makeGrant('g1')],
      entities: [makeEntity('e1')],
      matched: [{ grant_id: 'g1', entity_id: 'e1' }],
    })

    const result = await runMatching()
    expect(checkEligibility).not.toHaveBeenCalled()
    expect(computeFitScore).not.toHaveBeenCalled()
    expect(result.pairs_evaluated).toBe(0)
  })

  it('calls persistMatches with all built records', async () => {
    setupSupabaseMock({
      grants: [makeGrant('g1'), makeGrant('g2')],
      entities: [makeEntity('e1')],
    })
    vi.mocked(checkEligibility).mockReturnValue({ passed: true, failures: [] })
    vi.mocked(computeFitScore).mockReturnValue({
      score: 80,
      components: {
        missionAlignment: 0.5,
        angleMatch: 0.5,
        awardSizeFit: 0.5,
        deadlineUrgency: 0.5,
        funderPrestige: 0.5,
        winLoss: 0,
      },
      matchedAngles: [],
    })
    vi.mocked(persistMatches).mockResolvedValue({ upserted: 2, errors: 0 })

    await runMatching()
    expect(persistMatches).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(persistMatches).mock.calls[0][0]
    expect(arg).toHaveLength(2)
  })

  it('correctly maps entity boolean flags to eligibility tags', async () => {
    const entity = {
      ...makeEntity('e1'),
      is_african_american_owned: false,
      is_minority_owned: true,
      is_underserved_community_tied: false,
      is_tech_company: true,
      is_social_enterprise: false,
      is_community_serving: false,
    }
    setupSupabaseMock({
      grants: [makeGrant('g1')],
      entities: [entity],
    })
    vi.mocked(checkEligibility).mockReturnValue({ passed: true, failures: [] })
    vi.mocked(computeFitScore).mockReturnValue({
      score: 75,
      components: {
        missionAlignment: 0.5,
        angleMatch: 0.5,
        awardSizeFit: 0.5,
        deadlineUrgency: 0.5,
        funderPrestige: 0.5,
        winLoss: 0,
      },
      matchedAngles: [],
    })

    await runMatching()
    expect(computeFitScore).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(computeFitScore).mock.calls[0][0] as any
    expect(arg.entity.eligibility_tags).toContain('tech_company')
    expect(arg.entity.eligibility_tags).toContain('minority_owned')
    expect(arg.entity.eligibility_tags).not.toContain('african_american_owned')
    expect(arg.entity.eligibility_tags).not.toContain('underserved_community')
    expect(arg.entity.eligibility_tags).not.toContain('social_enterprise')
    expect(arg.entity.eligibility_tags).not.toContain('community_serving')
  })
})
