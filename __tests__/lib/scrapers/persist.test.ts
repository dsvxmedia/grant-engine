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

describe('persistGrants', () => {
  it('returns zero counts and skips DB when array is empty', async () => {
    const { persistGrants } = await import('@/lib/scrapers/persist')
    const result = await persistGrants([])
    expect(result).toEqual({ inserted: 0, errors: 0 })
    expect(mockedCreateServiceClient).not.toHaveBeenCalled()
  })

  it('upserts grants on content_hash and returns inserted count on success', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const grants = [makeGrant('h1'), makeGrant('h2'), makeGrant('h3')]
    const { persistGrants } = await import('@/lib/scrapers/persist')
    const result = await persistGrants(grants)

    expect(from).toHaveBeenCalledWith('grants')
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledWith(grants, {
      onConflict: 'content_hash',
      ignoreDuplicates: true,
    })
    expect(result).toEqual({ inserted: 3, errors: 0 })
  })

  it('returns full error count when supabase returns an error', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'boom' } })
    const from = vi.fn().mockReturnValue({ upsert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const grants = [makeGrant('h1'), makeGrant('h2')]
    const { persistGrants } = await import('@/lib/scrapers/persist')
    const result = await persistGrants(grants)

    expect(result).toEqual({ inserted: 0, errors: 2 })
  })
})
