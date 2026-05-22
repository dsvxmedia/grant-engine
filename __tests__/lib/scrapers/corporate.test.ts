import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadChromiumMock = vi.fn()

vi.mock('@/lib/scrapers/playwright-loader', () => ({
  loadChromium: loadChromiumMock,
}))

function resetMocks(evalReturn: unknown = []) {
  loadChromiumMock.mockReset().mockResolvedValue({
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(null),
        evaluate: vi.fn().mockResolvedValue(evalReturn),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  })
}

describe('scrapeGoogle', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'AI for Social Good',
        description: 'Funding AI projects for social good',
        url: 'https://www.google.org/projects/ai-good',
      },
    ])
  })

  it('returns RawGrant[] with source=google-org and funderType=corporate', async () => {
    const { scrapeGoogle } = await import('@/lib/scrapers/corporate/google')
    const result = await scrapeGoogle()

    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('google-org')
    expect(result[0].funderType).toBe('corporate')
    expect(result[0].funderName).toBe('Google.org')
  })

  it('returns [] on failure', async () => {
    loadChromiumMock.mockRejectedValueOnce(new Error('boom'))
    const { scrapeGoogle } = await import('@/lib/scrapers/corporate/google')
    const result = await scrapeGoogle()
    expect(result).toEqual([])
  })
})

describe('scrapeSba', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'Small Business Innovation Grant',
        description: 'Funding small business innovation',
        url: 'https://www.sba.gov/grants/abc',
      },
    ])
  })

  it('returns RawGrant[] with source=sba and funderType=federal', async () => {
    const { scrapeSba } = await import('@/lib/scrapers/corporate/sba')
    const result = await scrapeSba()

    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('sba')
    expect(result[0].funderType).toBe('federal')
    expect(result[0].funderName).toBe('U.S. Small Business Administration')
  })

  it('returns [] on failure', async () => {
    loadChromiumMock.mockRejectedValueOnce(new Error('boom'))
    const { scrapeSba } = await import('@/lib/scrapers/corporate/sba')
    const result = await scrapeSba()
    expect(result).toEqual([])
  })
})

describe('scrapeCorporate (orchestrator)', () => {
  beforeEach(() => {
    resetMocks([
      {
        title: 'Generic Grant',
        description: 'Generic',
        url: 'https://example.com/grant',
      },
    ])
  })

  it('merges results from google and sba scrapers', async () => {
    const { scrapeCorporate } = await import(
      '@/lib/scrapers/corporate/index'
    )
    const result = await scrapeCorporate()
    const sources = new Set(result.map((g) => g.source))
    expect(sources.has('google-org')).toBe(true)
    expect(sources.has('sba')).toBe(true)
  })

  it('handles partial failures gracefully', async () => {
    loadChromiumMock
      .mockResolvedValueOnce({
        launch: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            goto: vi.fn().mockResolvedValue(null),
            evaluate: vi.fn().mockResolvedValue([
              {
                title: 'Google Grant',
                description: 'd',
                url: 'https://g.com',
              },
            ]),
            close: vi.fn(),
          }),
          close: vi.fn(),
        }),
      })
      .mockRejectedValueOnce(new Error('sba down'))

    const { scrapeCorporate } = await import(
      '@/lib/scrapers/corporate/index'
    )
    const result = await scrapeCorporate()
    const sources = result.map((g) => g.source)
    expect(sources).toContain('google-org')
  })
})
