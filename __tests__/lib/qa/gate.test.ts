import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreNarrative } from '@/lib/qa/narrative'
import { scoreClarity } from '@/lib/qa/clarity'
import { scoreCompliance } from '@/lib/qa/compliance'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/qa/narrative', () => ({ scoreNarrative: vi.fn() }))
vi.mock('@/lib/qa/clarity', () => ({ scoreClarity: vi.fn() }))
vi.mock('@/lib/qa/compliance', () => ({ scoreCompliance: vi.fn() }))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedScoreNarrative = vi.mocked(scoreNarrative)
const mockedScoreClarity = vi.mocked(scoreClarity)
const mockedScoreCompliance = vi.mocked(scoreCompliance)

const PASSING_SCORE = { score: 8, issues: [], passed: true }
const FAILING_SCORE = { score: 5, issues: ['Quality too low'], passed: false }

function makeApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    grant_id: 'grant-1',
    qa_retry_count: 0,
    draft_content: {
      sections: [
        { name: 'Executive Summary', content: 'We are a great org.' },
        { name: 'Project Description', content: 'This is our project.' },
      ],
    },
    ...overrides,
  }
}

function makeGrant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'grant-1',
    title: 'Community Innovation Fund',
    funder_type: 'foundation',
    ...overrides,
  }
}

function makeSupabaseMock(application: Record<string, unknown> | null, grant: Record<string, unknown> | null = makeGrant()) {
  let callCount = 0

  // We need to handle two separate from() calls: one for grant_applications and one for grants
  const maybeSingleApp = vi.fn().mockResolvedValue({ data: application, error: application ? null : null })
  const eqApp = vi.fn().mockReturnValue({ maybeSingle: maybeSingleApp })
  const selectApp = vi.fn().mockReturnValue({ eq: eqApp })

  const maybeSingleGrant = vi.fn().mockResolvedValue({ data: grant, error: grant ? null : null })
  const eqGrant = vi.fn().mockReturnValue({ maybeSingle: maybeSingleGrant })
  const selectGrant = vi.fn().mockReturnValue({ eq: eqGrant })

  // For update operations
  const updatedData = application
    ? { ...application, status: 'pending_review', qa_scores: {}, qa_passed: true, qa_retry_count: 1 }
    : null
  const single = vi.fn().mockResolvedValue({ data: updatedData, error: null })
  const selectUpdate = vi.fn().mockReturnValue({ single })
  const eqUpdate = vi.fn().mockReturnValue({ select: selectUpdate })
  const update = vi.fn().mockReturnValue({ eq: eqUpdate })

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'grant_applications') {
      callCount++
      if (callCount === 1) {
        // First call: select (fetch)
        return { select: selectApp, update }
      }
      // Second call: update
      return { update }
    }
    if (table === 'grants') {
      return { select: selectGrant }
    }
    return { select: selectApp, update }
  })

  return { from, update, eqUpdate, selectUpdate, single }
}

function makeFlexibleSupabaseMock(
  application: Record<string, unknown> | null,
  grant: Record<string, unknown> | null = makeGrant()
) {
  const applicationFetch = { data: application, error: null }
  const grantFetch = { data: grant, error: null }
  const updateResult = { data: { ...application }, error: null }

  // Track calls to simulate stateful behavior
  const appMaybeSingle = vi.fn().mockResolvedValue(applicationFetch)
  const appEq = vi.fn().mockReturnValue({ maybeSingle: appMaybeSingle })
  const appSelect = vi.fn().mockReturnValue({ eq: appEq })

  const grantMaybeSingle = vi.fn().mockResolvedValue(grantFetch)
  const grantEq = vi.fn().mockReturnValue({ maybeSingle: grantMaybeSingle })
  const grantSelect = vi.fn().mockReturnValue({ eq: grantEq })

  const updateSingle = vi.fn().mockResolvedValue(updateResult)
  const updateSelectInner = vi.fn().mockReturnValue({ single: updateSingle })
  const updateEq = vi.fn().mockReturnValue({ select: updateSelectInner })
  const update = vi.fn().mockReturnValue({ eq: updateEq })

  let grantApplicationsCalls = 0
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'grants') {
      return { select: grantSelect }
    }
    // grant_applications
    grantApplicationsCalls++
    if (grantApplicationsCalls % 2 === 1) {
      // Odd calls: fetch (select)
      return { select: appSelect }
    }
    // Even calls: update
    return { update }
  })

  return { from }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('runQAGate', () => {
  it('runs all 3 scorers concurrently and stores results', async () => {
    mockedScoreNarrative.mockResolvedValue(PASSING_SCORE)
    mockedScoreClarity.mockResolvedValue(PASSING_SCORE)
    mockedScoreCompliance.mockResolvedValue(PASSING_SCORE)

    const application = makeApplication()
    const grant = makeGrant()

    // Use a single flexible mock that handles select and update
    const appFetchMaybeSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appFetchEq = vi.fn().mockReturnValue({ maybeSingle: appFetchMaybeSingle })
    const appFetchSelect = vi.fn().mockReturnValue({ eq: appFetchEq })

    const grantFetchMaybeSingle = vi.fn().mockResolvedValue({ data: grant, error: null })
    const grantFetchEq = vi.fn().mockReturnValue({ maybeSingle: grantFetchMaybeSingle })
    const grantFetchSelect = vi.fn().mockReturnValue({ eq: grantFetchEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
    const updateSelectFn = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEqFn = vi.fn().mockReturnValue({ select: updateSelectFn })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn })

    let appCallCount = 0
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return { select: grantFetchSelect }
      appCallCount++
      if (appCallCount === 1) return { select: appFetchSelect }
      return { update: updateFn }
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { runQAGate } = await import('@/lib/qa/gate')
    const result = await runQAGate('app-1')

    expect(mockedScoreNarrative).toHaveBeenCalledTimes(1)
    expect(mockedScoreClarity).toHaveBeenCalledTimes(1)
    expect(mockedScoreCompliance).toHaveBeenCalledTimes(1)
    expect(result.narrative).toEqual(PASSING_SCORE)
    expect(result.clarity).toEqual(PASSING_SCORE)
    expect(result.compliance).toEqual(PASSING_SCORE)
  })

  it("sets status to 'pending_review' when all scorers pass", async () => {
    mockedScoreNarrative.mockResolvedValue(PASSING_SCORE)
    mockedScoreClarity.mockResolvedValue(PASSING_SCORE)
    mockedScoreCompliance.mockResolvedValue(PASSING_SCORE)

    const application = makeApplication()
    const grant = makeGrant()

    const appFetchMaybeSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appFetchEq = vi.fn().mockReturnValue({ maybeSingle: appFetchMaybeSingle })
    const appFetchSelect = vi.fn().mockReturnValue({ eq: appFetchEq })

    const grantFetchMaybeSingle = vi.fn().mockResolvedValue({ data: grant, error: null })
    const grantFetchEq = vi.fn().mockReturnValue({ maybeSingle: grantFetchMaybeSingle })
    const grantFetchSelect = vi.fn().mockReturnValue({ eq: grantFetchEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
    const updateSelectFn = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEqFn = vi.fn().mockReturnValue({ select: updateSelectFn })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn })

    let appCallCount = 0
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return { select: grantFetchSelect }
      appCallCount++
      if (appCallCount === 1) return { select: appFetchSelect }
      return { update: updateFn }
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { runQAGate } = await import('@/lib/qa/gate')
    const result = await runQAGate('app-1')

    expect(result.overallPassed).toBe(true)
    expect(result.flaggedForManualReview).toBe(false)

    // Verify update was called with pending_review status
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending_review' })
    )
  })

  it("sets status to 'drafting' when any scorer fails and retry_count < 2", async () => {
    mockedScoreNarrative.mockResolvedValue(FAILING_SCORE)
    mockedScoreClarity.mockResolvedValue(PASSING_SCORE)
    mockedScoreCompliance.mockResolvedValue(PASSING_SCORE)

    const application = makeApplication({ qa_retry_count: 1 })
    const grant = makeGrant()

    const appFetchMaybeSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appFetchEq = vi.fn().mockReturnValue({ maybeSingle: appFetchMaybeSingle })
    const appFetchSelect = vi.fn().mockReturnValue({ eq: appFetchEq })

    const grantFetchMaybeSingle = vi.fn().mockResolvedValue({ data: grant, error: null })
    const grantFetchEq = vi.fn().mockReturnValue({ maybeSingle: grantFetchMaybeSingle })
    const grantFetchSelect = vi.fn().mockReturnValue({ eq: grantFetchEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
    const updateSelectFn = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEqFn = vi.fn().mockReturnValue({ select: updateSelectFn })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn })

    let appCallCount = 0
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return { select: grantFetchSelect }
      appCallCount++
      if (appCallCount === 1) return { select: appFetchSelect }
      return { update: updateFn }
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { runQAGate } = await import('@/lib/qa/gate')
    const result = await runQAGate('app-1')

    expect(result.overallPassed).toBe(false)
    expect(result.flaggedForManualReview).toBe(false)
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'drafting' })
    )
  })

  it("sets status to 'qa_failed' and flags for manual review when retry_count >= 2", async () => {
    mockedScoreNarrative.mockResolvedValue(FAILING_SCORE)
    mockedScoreClarity.mockResolvedValue(PASSING_SCORE)
    mockedScoreCompliance.mockResolvedValue(PASSING_SCORE)

    const application = makeApplication({ qa_retry_count: 2 })
    const grant = makeGrant()

    const appFetchMaybeSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appFetchEq = vi.fn().mockReturnValue({ maybeSingle: appFetchMaybeSingle })
    const appFetchSelect = vi.fn().mockReturnValue({ eq: appFetchEq })

    const grantFetchMaybeSingle = vi.fn().mockResolvedValue({ data: grant, error: null })
    const grantFetchEq = vi.fn().mockReturnValue({ maybeSingle: grantFetchMaybeSingle })
    const grantFetchSelect = vi.fn().mockReturnValue({ eq: grantFetchEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
    const updateSelectFn = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEqFn = vi.fn().mockReturnValue({ select: updateSelectFn })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn })

    let appCallCount = 0
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return { select: grantFetchSelect }
      appCallCount++
      if (appCallCount === 1) return { select: appFetchSelect }
      return { update: updateFn }
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { runQAGate } = await import('@/lib/qa/gate')
    const result = await runQAGate('app-1')

    expect(result.overallPassed).toBe(false)
    expect(result.flaggedForManualReview).toBe(true)
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'qa_failed' })
    )
  })

  it('overallPassed is true only when all three scorers pass', async () => {
    mockedScoreNarrative.mockResolvedValue(PASSING_SCORE)
    mockedScoreClarity.mockResolvedValue(FAILING_SCORE)
    mockedScoreCompliance.mockResolvedValue(PASSING_SCORE)

    const application = makeApplication()
    const grant = makeGrant()

    const appFetchMaybeSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appFetchEq = vi.fn().mockReturnValue({ maybeSingle: appFetchMaybeSingle })
    const appFetchSelect = vi.fn().mockReturnValue({ eq: appFetchEq })

    const grantFetchMaybeSingle = vi.fn().mockResolvedValue({ data: grant, error: null })
    const grantFetchEq = vi.fn().mockReturnValue({ maybeSingle: grantFetchMaybeSingle })
    const grantFetchSelect = vi.fn().mockReturnValue({ eq: grantFetchEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
    const updateSelectFn = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEqFn = vi.fn().mockReturnValue({ select: updateSelectFn })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn })

    let appCallCount = 0
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return { select: grantFetchSelect }
      appCallCount++
      if (appCallCount === 1) return { select: appFetchSelect }
      return { update: updateFn }
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { runQAGate } = await import('@/lib/qa/gate')
    const result = await runQAGate('app-1')

    expect(result.overallPassed).toBe(false)
    expect(result.narrative.passed).toBe(true)
    expect(result.clarity.passed).toBe(false)
    expect(result.compliance.passed).toBe(true)
  })

  it('throws when application not found in DB', async () => {
    const appFetchMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const appFetchEq = vi.fn().mockReturnValue({ maybeSingle: appFetchMaybeSingle })
    const appFetchSelect = vi.fn().mockReturnValue({ eq: appFetchEq })

    const from = vi.fn().mockReturnValue({ select: appFetchSelect })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { runQAGate } = await import('@/lib/qa/gate')
    await expect(runQAGate('missing-app')).rejects.toThrow('[qa/gate]')
  })
})
