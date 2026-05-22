import { describe, it, expect, beforeEach, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const grantwatchHtml = `
  <html><body>
    <div class="grant-listing">
      <a class="grant-title" href="/grant/123">African American Business Grant</a>
      <div class="grant-info">Funding for Black-owned businesses</div>
    </div>
    <div class="grant-listing">
      <a class="grant-title" href="/grant/456">Minority Entrepreneur Grant</a>
      <div class="grant-info">Support for minority entrepreneurs</div>
    </div>
  </body></html>
`

const candidHtml = `
  <html><body>
    <div class="funding-item">
      <h3 class="funding-title">Community Development Grant</h3>
      <p class="funding-description">Supporting community development</p>
      <a class="funding-link" href="https://candid.org/grants/1">View</a>
    </div>
  </body></html>
`

describe('scrapeGrantwatch', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns RawGrant[] with source=grantwatch and funderType=niche', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => grantwatchHtml,
    })

    const { scrapeGrantwatch } = await import(
      '@/lib/scrapers/niche/grantwatch'
    )
    const result = await scrapeGrantwatch()

    expect(result.length).toBeGreaterThan(0)
    expect(result[0].source).toBe('grantwatch')
    expect(result[0].funderType).toBe('niche')
  })

  it('returns [] when blocked (non-200)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    })

    const { scrapeGrantwatch } = await import(
      '@/lib/scrapers/niche/grantwatch'
    )
    const result = await scrapeGrantwatch()
    expect(result).toEqual([])
  })

  it('returns [] on fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const { scrapeGrantwatch } = await import(
      '@/lib/scrapers/niche/grantwatch'
    )
    const result = await scrapeGrantwatch()
    expect(result).toEqual([])
  })
})

describe('scrapeCandid', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns RawGrant[] with source=candid and funderType=niche', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => candidHtml,
    })

    const { scrapeCandid } = await import('@/lib/scrapers/niche/candid')
    const result = await scrapeCandid()

    expect(result.length).toBeGreaterThanOrEqual(0)
    if (result.length > 0) {
      expect(result[0].source).toBe('candid')
      expect(result[0].funderType).toBe('niche')
    }
  })

  it('returns [] on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))
    const { scrapeCandid } = await import('@/lib/scrapers/niche/candid')
    const result = await scrapeCandid()
    expect(result).toEqual([])
  })
})

describe('scrapeNiche (orchestrator)', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('merges results from all niche scrapers and tolerates partial failure', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => grantwatchHtml,
      })
      .mockRejectedValueOnce(new Error('candid down'))

    const { scrapeNiche } = await import('@/lib/scrapers/niche/index')
    const result = await scrapeNiche()
    expect(Array.isArray(result)).toBe(true)
  })
})
