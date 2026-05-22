import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { scrapeGrantsGov } from '@/lib/scrapers/grants-gov'
import { scrapeSamGov } from '@/lib/scrapers/sam-gov'
import { scrapeSbir } from '@/lib/scrapers/sbir'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function makeOppHit(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `OPP-${id}`,
    title: `Opportunity ${id}`,
    description: `Description for opportunity ${id}`,
    synopsis: `Synopsis ${id}`,
    agencyName: 'Department of Energy',
    applicationUrl: `https://apply.example.com/${id}`,
    awardFloor: '10000',
    awardCeiling: '500000',
    closeDate: '2026-12-31',
    responseDateStr: '2026-12-31',
    applicantTypes: ['nonprofit', 'small business'],
    opportunityCategory: 'D',
    ...overrides,
  }
}

function grantsGovResponse(
  hits: ReturnType<typeof makeOppHit>[],
  totalRecords: number,
  startRecordNum: number,
  endRecordNum: number
) {
  return {
    ok: true,
    json: async () => ({
      data: {
        oppHits: hits,
        totalRecords,
        startRecordNum,
        endRecordNum,
      },
    }),
  }
}

describe('scrapeGrantsGov', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns RawGrant[] with correct field mapping from API response', async () => {
    const hits = [makeOppHit(1)]
    fetchMock.mockResolvedValueOnce(grantsGovResponse(hits, 1, 0, 1))

    const result = await scrapeGrantsGov()

    expect(result).toHaveLength(1)
    const grant = result[0]
    expect(grant.source).toBe('grants-gov')
    expect(grant.sourceUrl).toBe(
      'https://www.grants.gov/search-results-detail/OPP-1'
    )
    expect(grant.applicationUrl).toBe('https://apply.example.com/1')
    expect(grant.title).toBe('Opportunity 1')
    expect(grant.description).toBe('Description for opportunity 1')
    expect(grant.funderName).toBe('Department of Energy')
    expect(grant.deadline).toBe('2026-12-31')
    expect(grant.eligibilityText).toBe('nonprofit, small business')
    expect(grant.categoryTags).toEqual(['D'])
  })

  it('paginates by making multiple fetch calls when totalRecords > rows', async () => {
    const page1 = Array.from({ length: 25 }, (_, i) => makeOppHit(i))
    const page2 = Array.from({ length: 25 }, (_, i) => makeOppHit(i + 25))
    fetchMock
      .mockResolvedValueOnce(grantsGovResponse(page1, 50, 0, 25))
      .mockResolvedValueOnce(grantsGovResponse(page2, 50, 25, 50))

    const result = await scrapeGrantsGov()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(50)
  })

  it('caps at 10 pages (250 records) even when totalRecords is higher', async () => {
    const page = Array.from({ length: 25 }, (_, i) => makeOppHit(i))
    for (let i = 0; i < 10; i++) {
      fetchMock.mockResolvedValueOnce(
        grantsGovResponse(page, 1000, i * 25, (i + 1) * 25)
      )
    }

    const result = await scrapeGrantsGov()

    expect(fetchMock).toHaveBeenCalledTimes(10)
    expect(result).toHaveLength(250)
  })

  it('returns [] on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const result = await scrapeGrantsGov()

    expect(result).toEqual([])
  })

  it('sets funderType=federal on all grants', async () => {
    const hits = [makeOppHit(1), makeOppHit(2), makeOppHit(3)]
    fetchMock.mockResolvedValueOnce(grantsGovResponse(hits, 3, 0, 3))

    const result = await scrapeGrantsGov()

    expect(result).toHaveLength(3)
    for (const grant of result) {
      expect(grant.funderType).toBe('federal')
    }
  })

  it('parses awardFloor and awardCeiling to numbers', async () => {
    const hits = [
      makeOppHit(1, { awardFloor: '25000', awardCeiling: '750000' }),
    ]
    fetchMock.mockResolvedValueOnce(grantsGovResponse(hits, 1, 0, 1))

    const result = await scrapeGrantsGov()

    expect(result[0].awardMin).toBe(25000)
    expect(result[0].awardMax).toBe(750000)
    expect(typeof result[0].awardMin).toBe('number')
    expect(typeof result[0].awardMax).toBe('number')
  })
})

describe('scrapeSamGov', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns mapped RawGrant[] from API response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        opportunitiesData: [
          {
            noticeId: 'SAM-123',
            title: 'Clean Energy Pilot',
            description: 'Funding for clean energy pilots.',
            departmentName: 'Department of Energy',
            organizationName: 'EERE',
            responseDeadLine: '2026-11-01T17:00:00-05:00',
            award: { amount: '1000000' },
            placeOfPerformance: { city: { name: 'Denver' } },
          },
        ],
        totalRecords: 1,
      }),
    })

    const result = await scrapeSamGov()

    expect(result).toHaveLength(1)
    const grant = result[0]
    expect(grant.source).toBe('sam-gov')
    expect(grant.sourceUrl).toBe('https://sam.gov/opp/SAM-123/view')
    expect(grant.title).toBe('Clean Energy Pilot')
    expect(grant.funderName).toBe('Department of Energy')
    expect(grant.funderType).toBe('federal')
    expect(grant.deadline).toBe('2026-11-01T17:00:00-05:00')
    expect(grant.awardMax).toBe(1000000)
    expect(grant.geographicRestrictions).toEqual({
      placeOfPerformance: { city: { name: 'Denver' } },
    })
  })

  it('returns [] on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))

    const result = await scrapeSamGov()

    expect(result).toEqual([])
  })
})

describe('scrapeSbir', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns mapped RawGrant[] with sbir_eligible and tech_company tags', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          program: 'SBIR',
          phase: 'I',
          agency: 'NSF',
          title: 'Quantum Sensing',
          open: '2026-05-01',
          close: '2026-08-15',
          description: 'Phase I quantum sensing solicitation.',
          solicitation_url: 'https://www.sbir.gov/sol/123',
        },
      ],
    })

    const result = await scrapeSbir()

    expect(result).toHaveLength(1)
    const grant = result[0]
    expect(grant.source).toBe('sbir')
    expect(grant.sourceUrl).toBe('https://www.sbir.gov/sol/123')
    expect(grant.title).toBe('NSF SBIR Phase I - Quantum Sensing')
    expect(grant.funderName).toBe('NSF')
    expect(grant.funderType).toBe('federal')
    expect(grant.deadline).toBe('2026-08-15')
    expect(grant.eligibilityTags).toEqual(['sbir_eligible', 'tech_company'])
    expect(grant.categoryTags).toEqual(['SBIR', 'Phase I'])
  })

  it('returns [] on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))

    const result = await scrapeSbir()

    expect(result).toEqual([])
  })
})
