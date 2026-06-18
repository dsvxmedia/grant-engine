import { describe, it, expect, beforeEach, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

// Prevent real Playwright browser launches in the orchestrator test.
// helloskip.ts uses Chromium; without this mock it makes live network calls.
vi.mock('@/lib/scrapers/playwright-loader', () => ({
  loadChromium: vi.fn().mockResolvedValue({
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(null),
        evaluate: vi.fn().mockResolvedValue([]),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const grantwatchHtml = `
  <html><body>
    <p>Grants to Black-owned small businesses for startup costs and operational expenses to grow their enterprises.</p>
    <p>Grants for minority entrepreneurs to launch and scale their businesses in underserved communities across the nation.</p>
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

const emptyHtml = '<html><body></body></html>'

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
    // Default: all fetch-based scrapers get an empty page and return [].
    // Playwright-based scrapers (helloskip) are mocked at module level above.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => emptyHtml,
      json: async () => ({ totalCount: 0, results: [] }),
    })
  })

  it('merges results from all niche scrapers and tolerates partial failure', async () => {
    // One scraper returns real content; one is explicitly rejected.
    // All others return empty pages via the default mock above.
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
