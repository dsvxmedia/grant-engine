import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { scrapeFederalRegister } from '@/lib/scrapers/federal-register'

type FRDoc = {
  document_number: string
  title: string
  abstract: string | null
  agencies: Array<{ name: string; id?: number }>
  publication_date?: string | null
  html_url: string
  pdf_url?: string | null
  effective_on?: string | null
  comments_close_on?: string | null
}

function fr(overrides: Partial<FRDoc> = {}): FRDoc {
  return {
    document_number: '2026-01234',
    title: 'Notice of Funding Availability for Clean Energy Innovation',
    abstract: 'This notice announces the availability of funds for clean energy.',
    agencies: [{ name: 'Department of Energy', id: 100 }],
    publication_date: '2026-01-15',
    html_url:
      'https://www.federalregister.gov/documents/2026/01/15/2026-01234/clean-energy-nofa',
    pdf_url:
      'https://www.federalregister.gov/documents/full_text/pdf/2026-01234.pdf',
    effective_on: null,
    comments_close_on: '2026-02-15',
    ...overrides,
  }
}

function okResponse(results: FRDoc[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      count: results.length,
      total_pages: 1,
      results,
    }),
  }
}

describe('scrapeFederalRegister', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns empty array on fetch failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('network error'))

    const result = await scrapeFederalRegister()

    expect(result).toEqual([])
  })

  it('returns empty array on non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const result = await scrapeFederalRegister()

    expect(result).toEqual([])
  })

  it('filters out non-grant documents', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      okResponse([
        fr({
          document_number: '2026-00001',
          title: 'Notice of Funding Availability for Workforce Training',
        }),
        fr({
          document_number: '2026-00002',
          title: 'Final Rule on Air Quality',
          abstract: 'Updates to ambient air standards.',
        }),
      ]) as unknown as Response
    )

    const result = await scrapeFederalRegister()

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe(
      'Notice of Funding Availability for Workforce Training'
    )
  })

  it('maps document fields to RawGrant correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      okResponse([
        fr({
          document_number: '2026-09999',
          title: 'Notice of Funding Availability for Rural Broadband',
          abstract: 'Broadband deployment grants for rural communities.',
          agencies: [
            { name: 'Department of Commerce', id: 200 },
            { name: 'NTIA', id: 201 },
          ],
          html_url:
            'https://www.federalregister.gov/documents/2026/03/01/2026-09999/rural-broadband',
          comments_close_on: '2026-04-30',
        }),
      ]) as unknown as Response
    )

    const result = await scrapeFederalRegister()

    expect(result).toHaveLength(1)
    const grant = result[0]
    expect(grant.source).toBe('federal-register')
    expect(grant.sourceUrl).toBe(
      'https://www.federalregister.gov/documents/2026/03/01/2026-09999/rural-broadband'
    )
    expect(grant.applicationUrl).toBe(
      'https://www.federalregister.gov/documents/2026/03/01/2026-09999/rural-broadband'
    )
    expect(grant.title).toBe(
      'Notice of Funding Availability for Rural Broadband'
    )
    expect(grant.description).toBe(
      'Broadband deployment grants for rural communities.'
    )
    expect(grant.funderName).toBe('Department of Commerce')
    expect(grant.funderType).toBe('federal')
    expect(grant.deadline).toBe('2026-04-30')
    expect(grant.isNewProgram).toBe(true)
    expect(grant.categoryTags).toEqual(['federal', 'nofa'])
    expect(grant.eligibilityTags).toEqual([])
  })

  it('handles missing optional fields gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      okResponse([
        {
          document_number: '2026-77777',
          title: 'Notice of Funding Availability for Health Initiatives',
          abstract: null,
          agencies: [],
          publication_date: '2026-05-01',
          html_url:
            'https://www.federalregister.gov/documents/2026/05/01/2026-77777/health',
          pdf_url: null,
          effective_on: null,
          comments_close_on: null,
        },
      ]) as unknown as Response
    )

    const result = await scrapeFederalRegister()

    expect(result).toHaveLength(1)
    const grant = result[0]
    expect(grant.description).toBeUndefined()
    expect(grant.funderName).toBeUndefined()
    expect(grant.deadline).toBeUndefined()
    expect(grant.isNewProgram).toBe(true)
    expect(grant.categoryTags).toEqual(['federal', 'nofa'])
  })
})
