import { describe, it, expect, beforeEach, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const georgiaHtml = `
  <html><body>
    <main>
      <article class="grant-card">
        <h3>Georgia Small Business Grant</h3>
        <p>Funding for Georgia small businesses.</p>
        <a href="https://www.georgia.org/grants/sb-1">Apply</a>
      </article>
      <article class="grant-card">
        <h3>Rural Georgia Innovation Grant</h3>
        <p>Supporting rural innovation in Georgia.</p>
        <a href="https://www.georgia.org/grants/rural-2">Apply</a>
      </article>
    </main>
  </body></html>
`

describe('scrapeGeorgia', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns RawGrant[] with source=georgia-state and funderType=state', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => georgiaHtml,
    })

    const { scrapeGeorgia } = await import('@/lib/scrapers/states/georgia')
    const result = await scrapeGeorgia()

    expect(result.length).toBeGreaterThan(0)
    expect(result[0].source).toBe('georgia-state')
    expect(result[0].funderType).toBe('state')
    expect(result[0].funderName).toBe('State of Georgia')
  })

  it('returns [] on non-200', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    })

    const { scrapeGeorgia } = await import('@/lib/scrapers/states/georgia')
    const result = await scrapeGeorgia()
    expect(result).toEqual([])
  })

  it('returns [] on fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const { scrapeGeorgia } = await import('@/lib/scrapers/states/georgia')
    const result = await scrapeGeorgia()
    expect(result).toEqual([])
  })
})

describe('scrapeStates (orchestrator)', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns an array merging all state scraper results', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => georgiaHtml,
    })

    const { scrapeStates } = await import('@/lib/scrapers/states/index')
    const result = await scrapeStates()
    expect(Array.isArray(result)).toBe(true)
    const sources = new Set(result.map((g) => g.source))
    expect(sources.has('georgia-state')).toBe(true)
  })
})
