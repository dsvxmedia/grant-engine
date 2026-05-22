import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))

vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

function textResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

function makeDraft() {
  return {
    sections: [
      { name: 'Executive Summary', content: 'We are a great org doing great things.', wordCount: 8 },
      { name: 'Needs Statement', content: 'The need is real and documented.', wordCount: 7 },
      { name: 'Budget Narrative', content: 'We will spend $50,000 on staff.', wordCount: 8 },
    ],
    rawText:
      '## Executive Summary\nWe are a great org doing great things.\n\n## Needs Statement\nThe need is real and documented.\n\n## Budget Narrative\nWe will spend $50,000 on staff.',
    selectedAngles: ['minority-owned enterprise', 'workforce pipeline'],
    selectedFramework: 'theory-of-change' as const,
    researchNotes: '{}',
  }
}

function makePassInput() {
  return {
    grant: {
      title: 'Community Innovation Grant',
      funder_name: 'Acme Foundation',
      funder_type: 'foundation',
      description: 'Funding for community innovation projects.',
      award_min: 10000,
      award_max: 50000,
      deadline: '2026-09-01',
      eligibility_tags: ['501c3', 'minority-owned'],
      category_tags: ['community', 'innovation'],
    },
    entity: {
      name: 'Birmingham Youth Collective',
      mission: 'Empowering young people through economic opportunity.',
      focus_area: 'workforce development',
      who_we_serve: ['youth 18-24', 'underserved communities'],
      is_minority_owned: true,
      is_tech_company: false,
      is_social_enterprise: true,
      pitch_angles_generated: ['equity lens', 'workforce pipeline'],
    },
    founderStory: 'Our founder started this organization after witnessing youth unemployment firsthand.',
    research: {
      funderBackground: 'Acme Foundation focuses on economic mobility in the Southeast.',
      previousRecipients: ['Community Works', 'Hope Center'],
      evaluationCriteria: ['community impact', 'organizational capacity', 'budget clarity'],
      requiredSections: ['Executive Summary', 'Needs Statement', 'Budget Narrative'],
      wordLimits: { 'Executive Summary': 250, 'Needs Statement': 600, 'Budget Narrative': 300 },
      selectedFramework: 'theory-of-change' as const,
      funderLanguage: ['equity-centered', 'community partners', 'systems change'],
      rawNotes: 'Guidelines fetched from Acme Foundation website.',
    },
    matchedAngles: ['minority-owned enterprise', 'workforce pipeline', 'youth economic mobility'],
  }
}

const validCritiqueJson = JSON.stringify({
  items: [
    {
      section: 'Needs Statement',
      issue: 'Lacks SMART objectives with measurable targets.',
      suggestion: 'Add a specific, time-bound objective with a measurable outcome.',
      severity: 'critical',
    },
    {
      section: 'overall',
      issue: 'Draft does not mirror funder language "systems change".',
      suggestion: 'Incorporate the phrase "systems change" at least twice.',
      severity: 'important',
    },
  ],
  overallScore: 6,
  summary: 'The draft is missing SMART objectives and funder language mirroring.',
})

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue(textResponse(validCritiqueJson))
})

describe('selfCritique', () => {
  describe('valid JSON response', () => {
    it('returns parsed CritiqueOutput when Claude returns valid JSON', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(makeDraft(), makePassInput())

      expect(result.items).toHaveLength(2)
      expect(result.items[0].section).toBe('Needs Statement')
      expect(result.items[0].issue).toContain('SMART objectives')
      expect(result.items[0].severity).toBe('critical')
      expect(result.overallScore).toBe(6)
      expect(result.summary).toContain('SMART objectives')
    })

    it('maps all CritiqueItem fields correctly', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(makeDraft(), makePassInput())

      const item = result.items[0]
      expect(item).toHaveProperty('section')
      expect(item).toHaveProperty('issue')
      expect(item).toHaveProperty('suggestion')
      expect(item).toHaveProperty('severity')
    })

    it('overallScore is always a number between 0 and 10', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(makeDraft(), makePassInput())

      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(10)
    })
  })

  describe('fallback on parse failure', () => {
    it('returns fallback when Claude returns non-JSON text', async () => {
      createMock.mockResolvedValue(
        textResponse('Sorry, I cannot process this request right now.')
      )

      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(makeDraft(), makePassInput())

      expect(result.items).toEqual([])
      expect(result.overallScore).toBe(5)
      expect(result.summary).toContain('Self-critique parsing failed')
    })

    it('does not throw when API call fails — returns fallback', async () => {
      createMock.mockRejectedValue(new Error('API rate limit exceeded'))

      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(makeDraft(), makePassInput())

      expect(result.items).toEqual([])
      expect(result.overallScore).toBe(5)
      expect(result.summary).toContain('Self-critique parsing failed')
    })

    it('overallScore in fallback is a number', async () => {
      createMock.mockRejectedValue(new Error('Network error'))

      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(makeDraft(), makePassInput())

      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBe(5)
    })
  })

  describe('word-limit issues', () => {
    it('includes word-limit issues when a section exceeds its limit', async () => {
      // Section "Needs Statement" has wordCount 7 — far under 600 limit.
      // Let's create a draft where Needs Statement exceeds its word limit.
      const overLimitDraft = {
        ...makeDraft(),
        sections: [
          {
            name: 'Executive Summary',
            content: 'We are a great org doing great things.',
            wordCount: 300, // exceeds limit of 250
          },
          {
            name: 'Needs Statement',
            content: 'The need is real and documented.',
            wordCount: 7,
          },
          {
            name: 'Budget Narrative',
            content: 'We will spend $50,000 on staff.',
            wordCount: 8,
          },
        ],
      }

      // Return a critique that includes a word-limit item
      const critiqueWithWordLimit = JSON.stringify({
        items: [
          {
            section: 'Executive Summary',
            issue: 'Section exceeds the 250-word limit (currently 300 words).',
            suggestion: 'Trim the Executive Summary to 250 words or fewer.',
            severity: 'critical',
          },
        ],
        overallScore: 7,
        summary: 'Executive Summary exceeds its word limit.',
      })
      createMock.mockResolvedValue(textResponse(critiqueWithWordLimit))

      const { selfCritique } = await import('@/lib/writing/passes/critique')

      const result = await selfCritique(overLimitDraft, makePassInput())

      const wordLimitItem = result.items.find((item) => item.section === 'Executive Summary')
      expect(wordLimitItem).toBeDefined()
      expect(wordLimitItem?.severity).toBe('critical')
    })
  })

  describe('prompt construction', () => {
    it('sends the draft rawText in the prompt', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')
      const draft = makeDraft()

      await selfCritique(draft, makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(draft.rawText)
    })

    it('includes evaluation criteria from research in the prompt', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')
      const input = makePassInput()

      await selfCritique(makeDraft(), input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain('community impact')
      expect(userMessage).toContain('budget clarity')
    })

    it('includes funder language from research in the prompt', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')
      const input = makePassInput()

      await selfCritique(makeDraft(), input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain('equity-centered')
      expect(userMessage).toContain('systems change')
    })

    it('calls Claude with model claude-sonnet-4-6', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')

      await selfCritique(makeDraft(), makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.model).toBe('claude-sonnet-4-6')
    })

    it('calls Claude with max_tokens 2048', async () => {
      const { selfCritique } = await import('@/lib/writing/passes/critique')

      await selfCritique(makeDraft(), makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.max_tokens).toBe(2048)
    })
  })
})
