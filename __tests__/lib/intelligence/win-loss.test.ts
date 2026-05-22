import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

function buildSupabaseMock(rows: unknown[]) {
  const selectChain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    data: rows,
    error: null,
  }
  // Make the chain thenable (await resolves to { data, error })
  Object.assign(selectChain, {
    then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data: rows, error: null }),
  })

  const from = vi.fn().mockReturnValue(selectChain)
  return { client: { from } as any, selectChain }
}

describe('analyzeWinLoss', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns empty report when no data', async () => {
    const { client } = buildSupabaseMock([])
    mockedCreateServiceClient.mockResolvedValue(client)

    const { analyzeWinLoss } = await import('@/lib/intelligence/win-loss')
    const report = await analyzeWinLoss()

    expect(report.segments).toHaveLength(0)
    expect(report.topPerformers).toHaveLength(0)
    expect(report.poorPerformers).toHaveLength(0)
    expect(report.relationshipFirstFunders).toHaveLength(0)
    expect(report.analyzedAt).toBeTruthy()
  })

  it('computes segments correctly with outcome data', async () => {
    const rows = [
      {
        id: 'app-1',
        outcome: 'awarded',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Acme', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
      {
        id: 'app-2',
        outcome: 'rejected',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Acme', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
      {
        id: 'app-3',
        outcome: 'awarded',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Acme', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
    ]

    const { client } = buildSupabaseMock(rows)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { analyzeWinLoss } = await import('@/lib/intelligence/win-loss')
    const report = await analyzeWinLoss()

    expect(report.segments.length).toBeGreaterThan(0)
    const foundationSeg = report.segments.find((s) =>
      s.dimension.includes('foundation')
    )
    expect(foundationSeg).toBeDefined()
    // 2 wins out of 3 attempts = ~0.667
    expect(foundationSeg!.winRate).toBeCloseTo(2 / 3, 2)
  })

  it('populates relationshipFirstFunders for funders with 3+ rejections and 0 wins', async () => {
    const rows = [
      {
        id: 'app-1',
        outcome: 'rejected',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Cold Funder', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
      {
        id: 'app-2',
        outcome: 'rejected',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Cold Funder', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
      {
        id: 'app-3',
        outcome: 'rejected',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Cold Funder', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
    ]

    const { client } = buildSupabaseMock(rows)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { analyzeWinLoss } = await import('@/lib/intelligence/win-loss')
    const report = await analyzeWinLoss()

    expect(report.relationshipFirstFunders).toContain('Cold Funder')
  })

  it('does not include funders with wins in relationshipFirstFunders', async () => {
    const rows = [
      {
        id: 'app-1',
        outcome: 'rejected',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Warm Funder', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
      {
        id: 'app-2',
        outcome: 'rejected',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Warm Funder', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
      {
        id: 'app-3',
        outcome: 'awarded',
        entity_id: 'e1',
        selected_framework: 'theory-of-change',
        grants: { funder_type: 'foundation', funder_name: 'Warm Funder', category_tags: [] },
        business_entities: { name: 'Org A' },
      },
    ]

    const { client } = buildSupabaseMock(rows)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { analyzeWinLoss } = await import('@/lib/intelligence/win-loss')
    const report = await analyzeWinLoss()

    expect(report.relationshipFirstFunders).not.toContain('Warm Funder')
  })

  it('returns empty report on Supabase error without throwing', async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: null; error: { message: string } }) => void) =>
        resolve({ data: null, error: { message: 'DB timeout' } }),
    }
    const from = vi.fn().mockReturnValue(selectChain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { analyzeWinLoss } = await import('@/lib/intelligence/win-loss')
    const report = await analyzeWinLoss()

    expect(report.segments).toHaveLength(0)
    expect(report.analyzedAt).toBeTruthy()
  })
})
