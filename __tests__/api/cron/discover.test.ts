import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeGrantsGov } from '@/lib/scrapers/grants-gov'
import { scrapeSamGov } from '@/lib/scrapers/sam-gov'
import { scrapeSbir } from '@/lib/scrapers/sbir'
import { scrapeFoundations } from '@/lib/scrapers/foundations'
import { scrapeCorporate } from '@/lib/scrapers/corporate'
import { scrapeNiche } from '@/lib/scrapers/niche'
import { scrapeStates } from '@/lib/scrapers/states'
import { normalizeGrant } from '@/lib/scrapers/normalize'
import { filterNewGrants } from '@/lib/scrapers/deduplicate'
import { persistGrants } from '@/lib/scrapers/persist'
import { createServiceClient } from '@/lib/supabase/server'
import type { NormalizedGrant, RawGrant } from '@/lib/scrapers/types'

vi.mock('@/lib/scrapers/grants-gov', () => ({ scrapeGrantsGov: vi.fn() }))
vi.mock('@/lib/scrapers/sam-gov', () => ({ scrapeSamGov: vi.fn() }))
vi.mock('@/lib/scrapers/sbir', () => ({ scrapeSbir: vi.fn() }))
vi.mock('@/lib/scrapers/foundations', () => ({ scrapeFoundations: vi.fn() }))
vi.mock('@/lib/scrapers/corporate', () => ({ scrapeCorporate: vi.fn() }))
vi.mock('@/lib/scrapers/niche', () => ({ scrapeNiche: vi.fn() }))
vi.mock('@/lib/scrapers/states', () => ({ scrapeStates: vi.fn() }))
vi.mock('@/lib/scrapers/normalize', () => ({ normalizeGrant: vi.fn() }))
vi.mock('@/lib/scrapers/deduplicate', () => ({ filterNewGrants: vi.fn() }))
vi.mock('@/lib/scrapers/persist', () => ({ persistGrants: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: vi.fn() }))
vi.mock('server-only', () => ({}))

function makeRaw(title: string): RawGrant {
  return { source: 'test', title }
}

function makeNormalized(hash: string): NormalizedGrant {
  return {
    source: 'test',
    source_url: null,
    application_url: null,
    title: 'Test',
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
    content_hash: hash,
    status: 'active',
  }
}

function stubScraperRunsInsert() {
  const insert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ insert })
  vi.mocked(createServiceClient).mockResolvedValue({ from } as any)
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('GET /api/cron/discover', () => {
  it('returns 401 without correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    vi.resetModules()
    const { GET } = await import('@/app/api/cron/discover/route')
    const req = new Request('http://localhost/api/cron/discover', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('returns 200 with correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    vi.mocked(scrapeGrantsGov).mockResolvedValue([])
    vi.mocked(scrapeSamGov).mockResolvedValue([])
    vi.mocked(scrapeSbir).mockResolvedValue([])
    vi.mocked(scrapeFoundations).mockResolvedValue([])
    vi.mocked(scrapeCorporate).mockResolvedValue([])
    vi.mocked(scrapeNiche).mockResolvedValue([])
    vi.mocked(scrapeStates).mockResolvedValue([])
    vi.mocked(filterNewGrants).mockResolvedValue([])
    vi.mocked(persistGrants).mockResolvedValue({ inserted: 0, errors: 0 })
    stubScraperRunsInsert()

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/discover/route')
    const req = new Request('http://localhost/api/cron/discover', {
      headers: { authorization: 'Bearer real-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    vi.unstubAllEnvs()
  })

  it('calls all scrapers in parallel and returns summary', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    vi.mocked(scrapeGrantsGov).mockResolvedValue([makeRaw('a'), makeRaw('b')])
    vi.mocked(scrapeSamGov).mockResolvedValue([makeRaw('c')])
    vi.mocked(scrapeSbir).mockResolvedValue([makeRaw('d')])
    vi.mocked(scrapeFoundations).mockResolvedValue([makeRaw('e')])
    vi.mocked(scrapeCorporate).mockResolvedValue([makeRaw('f')])
    vi.mocked(scrapeNiche).mockResolvedValue([makeRaw('g')])
    vi.mocked(scrapeStates).mockResolvedValue([makeRaw('h')])

    let hashCounter = 0
    vi.mocked(normalizeGrant).mockImplementation(() =>
      makeNormalized(`h${++hashCounter}`)
    )
    vi.mocked(filterNewGrants).mockImplementation(async (grants) => grants)
    vi.mocked(persistGrants).mockImplementation(async (grants) => ({
      inserted: grants.length,
      errors: 0,
    }))
    stubScraperRunsInsert()

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/discover/route')
    const req = new Request('http://localhost/api/cron/discover', {
      headers: { authorization: 'Bearer real-secret' },
    })
    const res = await GET(req as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.scrapers).toEqual({ total: 7, succeeded: 7, failed: 0 })
    expect(body.grants).toEqual({
      raw: 8,
      normalized: 8,
      new: 8,
      inserted: 8,
    })
    expect(scrapeGrantsGov).toHaveBeenCalledTimes(1)
    expect(scrapeSamGov).toHaveBeenCalledTimes(1)
    expect(scrapeSbir).toHaveBeenCalledTimes(1)
    expect(scrapeFoundations).toHaveBeenCalledTimes(1)
    expect(scrapeCorporate).toHaveBeenCalledTimes(1)
    expect(scrapeNiche).toHaveBeenCalledTimes(1)
    expect(scrapeStates).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })

  it('tolerates individual scraper failures', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    vi.mocked(scrapeGrantsGov).mockRejectedValue(new Error('grants.gov down'))
    vi.mocked(scrapeSamGov).mockResolvedValue([makeRaw('a')])
    vi.mocked(scrapeSbir).mockResolvedValue([makeRaw('b')])
    vi.mocked(scrapeFoundations).mockRejectedValue(new Error('foundations down'))
    vi.mocked(scrapeCorporate).mockResolvedValue([makeRaw('c')])
    vi.mocked(scrapeNiche).mockResolvedValue([makeRaw('d')])
    vi.mocked(scrapeStates).mockResolvedValue([makeRaw('e')])

    let hashCounter = 0
    vi.mocked(normalizeGrant).mockImplementation(() =>
      makeNormalized(`h${++hashCounter}`)
    )
    vi.mocked(filterNewGrants).mockImplementation(async (grants) => grants)
    vi.mocked(persistGrants).mockImplementation(async (grants) => ({
      inserted: grants.length,
      errors: 0,
    }))
    stubScraperRunsInsert()

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/discover/route')
    const req = new Request('http://localhost/api/cron/discover', {
      headers: { authorization: 'Bearer real-secret' },
    })
    const res = await GET(req as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.scrapers.total).toBe(7)
    expect(body.scrapers.succeeded).toBe(5)
    expect(body.scrapers.failed).toBe(2)
    expect(body.grants.raw).toBe(5)
    vi.unstubAllEnvs()
  })
})
