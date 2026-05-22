import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

function buildSupabaseMock(grant: unknown, entity: unknown) {
  const grantChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: grant, error: null }),
  }
  const entityChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: entity, error: null }),
  }
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'grants') return grantChain
    if (table === 'business_entities') return entityChain
    throw new Error(`Unexpected table: ${table}`)
  })
  return { client: { from } as any }
}

describe('scoreCompetitiveDensity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('priorityBoost is +0.3 for new program', async () => {
    const grant = {
      id: 'g1',
      is_new_program: true,
      competition_estimate: null,
      eligibility_tags: [],
    }
    const entity = {
      id: 'e1',
      is_minority_owned: false,
      is_african_american_owned: false,
      is_tech_company: false,
      is_sbir_eligible: false,
      eligibility_tags: [],
    }
    const { client } = buildSupabaseMock(grant, entity)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { scoreCompetitiveDensity } = await import('@/lib/intelligence/competitive')
    const result = await scoreCompetitiveDensity('g1', 'e1')

    expect(result.priorityBoost).toBe(0.3)
    expect(result.isNewProgram).toBe(true)
  })

  it('priorityBoost is -0.2 for estimatedApplicants > 1000', async () => {
    const grant = {
      id: 'g1',
      is_new_program: false,
      competition_estimate: 1500,
      eligibility_tags: [],
    }
    const entity = {
      id: 'e1',
      is_minority_owned: false,
      is_african_american_owned: false,
      is_tech_company: false,
      is_sbir_eligible: false,
      eligibility_tags: [],
    }
    const { client } = buildSupabaseMock(grant, entity)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { scoreCompetitiveDensity } = await import('@/lib/intelligence/competitive')
    const result = await scoreCompetitiveDensity('g1', 'e1')

    expect(result.priorityBoost).toBe(-0.2)
    expect(result.estimatedApplicants).toBe(1500)
  })

  it('priorityBoost is +0.2 for estimatedApplicants < 50', async () => {
    const grant = {
      id: 'g1',
      is_new_program: false,
      competition_estimate: 30,
      eligibility_tags: [],
    }
    const entity = {
      id: 'e1',
      is_minority_owned: false,
      is_african_american_owned: false,
      is_tech_company: false,
      is_sbir_eligible: false,
      eligibility_tags: [],
    }
    const { client } = buildSupabaseMock(grant, entity)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { scoreCompetitiveDensity } = await import('@/lib/intelligence/competitive')
    const result = await scoreCompetitiveDensity('g1', 'e1')

    expect(result.priorityBoost).toBe(0.2)
  })

  it('profileRarityScore > 0 when entity has eligibility flags', async () => {
    const grant = {
      id: 'g1',
      is_new_program: false,
      competition_estimate: null,
      eligibility_tags: [],
    }
    const entity = {
      id: 'e1',
      is_minority_owned: true,
      is_african_american_owned: false,
      is_tech_company: true,
      is_sbir_eligible: false,
      eligibility_tags: ['minority_owned', 'tech_company'],
    }
    const { client } = buildSupabaseMock(grant, entity)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { scoreCompetitiveDensity } = await import('@/lib/intelligence/competitive')
    const result = await scoreCompetitiveDensity('g1', 'e1')

    expect(result.profileRarityScore).toBeGreaterThan(0)
    // Expected: 1 - (0.15 * 0.25) = 0.9625
    expect(result.profileRarityScore).toBeCloseTo(0.9625, 3)
  })

  it('returns safe defaults when grant is not found', async () => {
    const entityChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const grantChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return grantChain
      return entityChain
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { scoreCompetitiveDensity } = await import('@/lib/intelligence/competitive')
    const result = await scoreCompetitiveDensity('missing', 'e1')

    expect(result.grantId).toBe('missing')
    expect(result.priorityBoost).toBe(0)
    expect(result.profileRarityScore).toBe(0)
  })
})
