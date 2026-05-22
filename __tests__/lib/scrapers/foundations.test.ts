import { describe, it, expect, beforeEach, vi } from 'vitest'

const evaluateMock = vi.fn()
const newPageMock = vi.fn()
const launchMock = vi.fn()
const loadChromiumMock = vi.fn()

vi.mock('@/lib/scrapers/playwright-loader', () => ({
  loadChromium: loadChromiumMock,
}))

function resetMocks(evalReturn: unknown = []) {
  evaluateMock.mockReset().mockResolvedValue(evalReturn)
  newPageMock.mockReset().mockResolvedValue({
    goto: vi.fn().mockResolvedValue(null),
    evaluate: evaluateMock,
    close: vi.fn().mockResolvedValue(undefined),
  })
  launchMock.mockReset().mockResolvedValue({
    newPage: newPageMock,
    close: vi.fn().mockResolvedValue(undefined),
  })
  loadChromiumMock.mockReset().mockResolvedValue({
    launch: launchMock,
  })
}

describe('scrapeFord', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'Racial Justice Grant',
        description: 'Supporting racial equity work',
        url: 'https://www.fordfoundation.org/grants/123',
      },
    ])
  })

  it('returns RawGrant[] with source=ford-foundation and funderType=foundation', async () => {
    const { scrapeFord } = await import('@/lib/scrapers/foundations/ford')
    const result = await scrapeFord()

    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('ford-foundation')
    expect(result[0].funderType).toBe('foundation')
    expect(result[0].funderName).toBe('Ford Foundation')
    expect(result[0].title).toBe('Racial Justice Grant')
  })

  it('returns [] on launch failure', async () => {
    loadChromiumMock.mockRejectedValueOnce(new Error('browser failed'))
    const { scrapeFord } = await import('@/lib/scrapers/foundations/ford')
    const result = await scrapeFord()
    expect(result).toEqual([])
  })
})

describe('scrapeGates', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'Global Health Initiative',
        description: 'Funding global health research',
        url: 'https://www.gatesfoundation.org/grants/abc',
      },
    ])
  })

  it('returns RawGrant[] with source=gates-foundation and funderType=foundation', async () => {
    const { scrapeGates } = await import('@/lib/scrapers/foundations/gates')
    const result = await scrapeGates()

    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('gates-foundation')
    expect(result[0].funderType).toBe('foundation')
    expect(result[0].funderName).toBe('Bill & Melinda Gates Foundation')
  })

  it('returns [] on failure', async () => {
    loadChromiumMock.mockRejectedValueOnce(new Error('boom'))
    const { scrapeGates } = await import('@/lib/scrapers/foundations/gates')
    const result = await scrapeGates()
    expect(result).toEqual([])
  })
})

describe('scrapeKellogg', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'Children & Families Grant',
        description: 'Supporting children and families',
        url: 'https://www.wkkf.org/grants/xyz',
      },
    ])
  })

  it('returns RawGrant[] with source=kellogg-foundation and funderType=foundation', async () => {
    const { scrapeKellogg } = await import(
      '@/lib/scrapers/foundations/kellogg'
    )
    const result = await scrapeKellogg()

    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('kellogg-foundation')
    expect(result[0].funderType).toBe('foundation')
    expect(result[0].funderName).toBe('W.K. Kellogg Foundation')
  })

  it('returns [] on failure', async () => {
    loadChromiumMock.mockRejectedValueOnce(new Error('boom'))
    const { scrapeKellogg } = await import(
      '@/lib/scrapers/foundations/kellogg'
    )
    const result = await scrapeKellogg()
    expect(result).toEqual([])
  })
})

describe('scrapeFoundations (orchestrator)', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'Generic Grant',
        description: 'Generic',
        url: 'https://example.com/grant',
      },
    ])
  })

  it('merges results from all foundation scrapers', async () => {
    const { scrapeFoundations } = await import(
      '@/lib/scrapers/foundations/index'
    )
    const result = await scrapeFoundations()
    expect(result.length).toBeGreaterThanOrEqual(3)
    const sources = new Set(result.map((g) => g.source))
    expect(sources.has('ford-foundation')).toBe(true)
    expect(sources.has('gates-foundation')).toBe(true)
    expect(sources.has('kellogg-foundation')).toBe(true)
  })

  it('handles partial failures — returns successful scrapers when one throws', async () => {
    loadChromiumMock
      .mockResolvedValueOnce({
        launch: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            goto: vi.fn().mockResolvedValue(null),
            evaluate: vi.fn().mockResolvedValue([
              {
                title: 'Ford Grant',
                description: 'd',
                url: 'https://f.com',
              },
            ]),
            close: vi.fn(),
          }),
          close: vi.fn(),
        }),
      })
      .mockRejectedValueOnce(new Error('gates down'))
      .mockResolvedValueOnce({
        launch: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            goto: vi.fn().mockResolvedValue(null),
            evaluate: vi.fn().mockResolvedValue([
              {
                title: 'Kellogg Grant',
                description: 'd',
                url: 'https://k.com',
              },
            ]),
            close: vi.fn(),
          }),
          close: vi.fn(),
        }),
      })

    const { scrapeFoundations } = await import(
      '@/lib/scrapers/foundations/index'
    )
    const result = await scrapeFoundations()
    const sources = result.map((g) => g.source)
    expect(sources).toContain('ford-foundation')
    expect(sources).toContain('kellogg-foundation')
  })
})
