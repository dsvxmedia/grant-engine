import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

const anthropicCreateMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: anthropicCreateMock }
  },
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

describe('findCoalitionPartners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns [] when coalition_preferred is false', async () => {
    const grant = {
      id: 'g1',
      coalition_preferred: false,
      eligibility_tags: [],
      title: 'Test Grant',
    }
    const entity = {
      id: 'e1',
      mission: 'tech innovation for communities',
    }
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
    const partnersChain = {
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return grantChain
      if (table === 'business_entities') return entityChain
      return partnersChain
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { findCoalitionPartners } = await import('@/lib/intelligence/coalition')
    const result = await findCoalitionPartners('g1', 'e1')

    expect(result).toEqual([])
  })

  it('returns top 3 partners by mission overlap when coalition_preferred is true', async () => {
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: 'Partnership inquiry email body.' }],
    })

    const grant = {
      id: 'g1',
      coalition_preferred: true,
      eligibility_tags: ['tech_company'],
      title: 'Coalition Tech Grant',
    }
    const entity = {
      id: 'e1',
      mission: 'technology innovation community development workforce',
    }
    const partners = [
      { id: 'p1', name: 'Partner A', mission: 'technology innovation workforce training' },
      { id: 'p2', name: 'Partner B', mission: 'community arts culture' },
      { id: 'p3', name: 'Partner C', mission: 'innovation development tech workforce jobs' },
      { id: 'p4', name: 'Partner D', mission: 'healthcare services rural areas' },
    ]

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
    const partnersChain = {
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: typeof partners; error: null }) => void) =>
        resolve({ data: partners, error: null }),
    }

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return grantChain
      if (table === 'business_entities') return entityChain
      return partnersChain
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { findCoalitionPartners } = await import('@/lib/intelligence/coalition')
    const result = await findCoalitionPartners('g1', 'e1')

    // Should return at most 3
    expect(result.length).toBeLessThanOrEqual(3)
    expect(result.length).toBeGreaterThan(0)
    // Each match should have required fields
    expect(result[0]).toHaveProperty('partnerId')
    expect(result[0]).toHaveProperty('partnerName')
    expect(result[0]).toHaveProperty('missionOverlap')
    expect(result[0]).toHaveProperty('inquiryDraft')
    expect(Array.isArray(result[0].missionOverlap)).toBe(true)
  })

  it('returns [] when no partners exist in DB', async () => {
    const grant = {
      id: 'g1',
      coalition_preferred: true,
      eligibility_tags: [],
      title: 'Test Grant',
    }
    const entity = {
      id: 'e1',
      mission: 'tech innovation',
    }
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
    const partnersChain = {
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'grants') return grantChain
      if (table === 'business_entities') return entityChain
      return partnersChain
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { findCoalitionPartners } = await import('@/lib/intelligence/coalition')
    const result = await findCoalitionPartners('g1', 'e1')

    expect(result).toEqual([])
  })
})

describe('draftPartnerInquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns Claude response on success', async () => {
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: 'We would love to partner with you on this grant.' }],
    })

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { draftPartnerInquiry } = await import('@/lib/intelligence/coalition')
    const result = await draftPartnerInquiry('Partner Org', 'Tech Grant', 'Tech for all')

    expect(result).toContain('We would love to partner')
  })

  it('returns template string when Claude fails', async () => {
    anthropicCreateMock.mockRejectedValue(new Error('API error'))

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { draftPartnerInquiry } = await import('@/lib/intelligence/coalition')
    const result = await draftPartnerInquiry('Partner Org', 'Tech Grant', 'Tech for all')

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(10)
  })
})
