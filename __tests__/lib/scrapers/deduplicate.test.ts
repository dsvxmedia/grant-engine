import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import type { NormalizedGrant } from '@/lib/scrapers/types'

vi.mock('@/lib/supabase/server', () => ({ createServiceClient: vi.fn() }))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)

function makeGrant(content_hash: string): NormalizedGrant {
  return {
    source: 'grants-gov',
    source_url: null,
    application_url: null,
    title: 'Test Grant',
    description: null,
    funder_name: null,
    funder_type: null,
    award_min: null,
    award_max: null,
    deadline: null,
    eligibility_text: null,
    eligibility_tags: [],
    category_tags: [],
    geographic_restrictions: {},
    requires_loi: false,
    loi_deadline: null,
    requires_video: false,
    coalition_preferred: false,
    competition_estimate: null,
    is_new_program: false,
    content_hash,
    status: 'active',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isDuplicate', () => {
  it('returns true when hash exists in DB', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'abc' } })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { isDuplicate } = await import('@/lib/scrapers/deduplicate')
    expect(await isDuplicate('hash-1')).toBe(true)
    expect(from).toHaveBeenCalledWith('grants')
    expect(eq).toHaveBeenCalledWith('content_hash', 'hash-1')
  })

  it('returns false when hash is not in DB', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { isDuplicate } = await import('@/lib/scrapers/deduplicate')
    expect(await isDuplicate('hash-missing')).toBe(false)
  })
})

describe('filterNewGrants', () => {
  function mockExistingHashes(rows: Array<{ content_hash: string }>) {
    const inFn = vi.fn().mockResolvedValue({ data: rows })
    const select = vi.fn().mockReturnValue({ in: inFn })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)
    return { from, select, inFn }
  }

  it('returns only grants with hashes not in DB', async () => {
    mockExistingHashes([{ content_hash: 'h1' }])
    const { filterNewGrants } = await import('@/lib/scrapers/deduplicate')

    const result = await filterNewGrants([
      makeGrant('h1'),
      makeGrant('h2'),
      makeGrant('h3'),
    ])

    expect(result.map((g) => g.content_hash)).toEqual(['h2', 'h3'])
  })

  it('returns empty array when all grants are duplicates', async () => {
    mockExistingHashes([{ content_hash: 'h1' }, { content_hash: 'h2' }])
    const { filterNewGrants } = await import('@/lib/scrapers/deduplicate')

    const result = await filterNewGrants([makeGrant('h1'), makeGrant('h2')])
    expect(result).toEqual([])
  })

  it('returns all grants when none are duplicates', async () => {
    mockExistingHashes([])
    const { filterNewGrants } = await import('@/lib/scrapers/deduplicate')

    const grants = [makeGrant('h1'), makeGrant('h2')]
    const result = await filterNewGrants(grants)
    expect(result).toHaveLength(2)
    expect(result.map((g) => g.content_hash)).toEqual(['h1', 'h2'])
  })

  it('makes a single batch query (not N individual queries)', async () => {
    const { inFn, from } = mockExistingHashes([])
    const { filterNewGrants } = await import('@/lib/scrapers/deduplicate')

    await filterNewGrants([
      makeGrant('h1'),
      makeGrant('h2'),
      makeGrant('h3'),
    ])

    expect(from).toHaveBeenCalledTimes(1)
    expect(inFn).toHaveBeenCalledTimes(1)
    expect(inFn).toHaveBeenCalledWith('content_hash', ['h1', 'h2', 'h3'])
  })
})
