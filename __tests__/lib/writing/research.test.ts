import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))
vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

// Mock global fetch to prevent real network calls
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function textResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

function baseGrant() {
  return {
    title: 'Community Innovation Grant',
    funder_name: 'Acme Foundation',
    funder_type: 'foundation',
    description: 'Funding for community innovation projects. Required sections: Executive Summary, Project Description, Budget.',
    eligibility_text: '501(c)(3) organizations only',
    source_url: 'https://example.com/grant',
    application_url: null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default fetch: return empty HTML
  fetchMock.mockResolvedValue({
    ok: true,
    text: async () => '<html><body>Grant guidelines content</body></html>',
  })
  // Default Claude response for synthesis calls
  createMock.mockResolvedValue(textResponse('Synthesized funder research content.'))
})

describe('researchGrant', () => {
  describe('null funder_name', () => {
    it('returns sensible defaults when funder_name is null', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({
        grant: { ...baseGrant(), funder_name: null },
      })

      expect(result.funderBackground).toBeDefined()
      expect(typeof result.funderBackground).toBe('string')
      expect(Array.isArray(result.previousRecipients)).toBe(true)
      expect(Array.isArray(result.evaluationCriteria)).toBe(true)
      expect(Array.isArray(result.requiredSections)).toBe(true)
      expect(typeof result.wordLimits).toBe('object')
      expect(Array.isArray(result.funderLanguage)).toBe(true)
      expect(typeof result.rawNotes).toBe('string')
    })

    it('makes no Claude calls when funder_name is null', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      await researchGrant({
        grant: { ...baseGrant(), funder_name: null },
      })

      // Only the section extraction call should happen (not the 3 web search calls)
      // Actually per spec: skip funder web searches if funder_name is null
      // Section extraction call still happens
      const callCount = createMock.mock.calls.length
      // At most 1 call (section extraction), not 4 (3 searches + 1 section)
      expect(callCount).toBeLessThanOrEqual(1)
    })
  })

  describe('framework selection', () => {
    it('selects logic-model for federal funder type', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({
        grant: { ...baseGrant(), funder_type: 'federal' },
      })

      expect(result.selectedFramework).toBe('logic-model')
    })

    it('selects theory-of-change for foundation funder type', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({
        grant: { ...baseGrant(), funder_type: 'foundation' },
      })

      expect(result.selectedFramework).toBe('theory-of-change')
    })

    it('selects roi for corporate funder type', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({
        grant: { ...baseGrant(), funder_type: 'corporate' },
      })

      expect(result.selectedFramework).toBe('roi')
    })

    it('selects narrative for niche (unrecognized) funder type', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({
        grant: { ...baseGrant(), funder_type: 'niche' },
      })

      expect(result.selectedFramework).toBe('narrative')
    })

    it('selects narrative for null funder type', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({
        grant: { ...baseGrant(), funder_type: null },
      })

      expect(result.selectedFramework).toBe('narrative')
    })
  })

  describe('selectedFramework is always valid', () => {
    const validFrameworks = ['logic-model', 'theory-of-change', 'roi', 'narrative']

    it('returns a valid framework value for each funder type', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      const types = ['federal', 'foundation', 'corporate', 'niche', null, 'state', 'unknown']
      for (const funder_type of types) {
        const result = await researchGrant({
          grant: { ...baseGrant(), funder_type },
        })
        expect(validFrameworks).toContain(result.selectedFramework)
      }
    })
  })

  describe('section extraction fallback', () => {
    it('falls back to default sections when Claude returns non-JSON', async () => {
      // First calls (synthesis) return normal text, last call (section extraction) returns non-JSON
      createMock
        .mockResolvedValueOnce(textResponse('Recipients info'))
        .mockResolvedValueOnce(textResponse('Criteria info'))
        .mockResolvedValueOnce(textResponse('Priorities info'))
        .mockResolvedValueOnce(textResponse('This is not valid JSON at all'))

      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({ grant: baseGrant() })

      const defaultSections = [
        'Executive Summary',
        'Organizational Background',
        'Problem / Needs Statement',
        'Project Description & Methodology',
        'Goals, Objectives & Evaluation Plan',
        'Budget Narrative',
        'Sustainability Plan',
      ]
      expect(result.requiredSections).toEqual(defaultSections)
    })

    it('falls back to default sections when Claude returns empty array JSON', async () => {
      createMock
        .mockResolvedValueOnce(textResponse('Recipients info'))
        .mockResolvedValueOnce(textResponse('Criteria info'))
        .mockResolvedValueOnce(textResponse('Priorities info'))
        .mockResolvedValueOnce(textResponse('[]'))

      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({ grant: baseGrant() })

      expect(result.requiredSections.length).toBe(7)
    })
  })

  describe('error resilience', () => {
    it('never throws even when fetch fails', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'))
      createMock.mockResolvedValue(textResponse('Some content'))

      const { researchGrant } = await import('@/lib/writing/research')

      await expect(
        researchGrant({ grant: baseGrant() })
      ).resolves.not.toThrow()
    })

    it('never throws even when Claude API fails for all calls', async () => {
      createMock.mockRejectedValue(new Error('API rate limit'))

      const { researchGrant } = await import('@/lib/writing/research')

      await expect(
        researchGrant({ grant: baseGrant() })
      ).resolves.not.toThrow()
    })

    it('returns result object with all required keys even on total failure', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'))
      createMock.mockRejectedValue(new Error('API error'))

      const { researchGrant } = await import('@/lib/writing/research')

      const result = await researchGrant({ grant: baseGrant() })

      expect(result).toHaveProperty('funderBackground')
      expect(result).toHaveProperty('previousRecipients')
      expect(result).toHaveProperty('evaluationCriteria')
      expect(result).toHaveProperty('requiredSections')
      expect(result).toHaveProperty('wordLimits')
      expect(result).toHaveProperty('selectedFramework')
      expect(result).toHaveProperty('funderLanguage')
      expect(result).toHaveProperty('rawNotes')
    })

    it('never throws when source_url is null', async () => {
      const { researchGrant } = await import('@/lib/writing/research')

      await expect(
        researchGrant({ grant: { ...baseGrant(), source_url: null } })
      ).resolves.not.toThrow()
    })
  })
})
