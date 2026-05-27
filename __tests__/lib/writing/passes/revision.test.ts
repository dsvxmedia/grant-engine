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
    researchNotes: '{"funderBackground":"Test funder"}',
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
      industry: 'Workforce Development',
      city: 'Birmingham',
      state: 'AL',
      founding_date: null,
      employee_count: null,
      mission: 'Empowering young people through economic opportunity.',
      focus_area: 'workforce development',
      who_we_serve: ['youth 18-24', 'underserved communities'],
      is_african_american_owned: false,
      is_minority_owned: true,
      is_underserved_community_tied: true,
      is_tech_company: false,
      is_social_enterprise: true,
      is_community_serving: true,
      pitch_angles_generated: ['equity lens', 'workforce pipeline'],
    },
    founderName: 'Test Founder',
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

function makeCritique() {
  return {
    items: [
      {
        section: 'Needs Statement',
        issue: 'Lacks SMART objectives with measurable targets.',
        suggestion: 'Add a specific, time-bound objective with a measurable outcome.',
        severity: 'critical' as const,
      },
      {
        section: 'overall',
        issue: 'Draft does not mirror funder language "systems change".',
        suggestion: 'Incorporate the phrase "systems change" at least twice.',
        severity: 'important' as const,
      },
    ],
    overallScore: 6,
    summary: 'The draft is missing SMART objectives and funder language mirroring.',
  }
}

function makeEmptyCritique() {
  return {
    items: [],
    overallScore: 7,
    summary: 'No issues found.',
  }
}

function makeExcellentCritique() {
  return {
    items: [
      {
        section: 'Needs Statement',
        issue: 'Minor wording tweak possible.',
        suggestion: 'Consider slightly more vivid language.',
        severity: 'minor' as const,
      },
    ],
    overallScore: 9,
    summary: 'The draft is excellent.',
  }
}

const revisedRawText =
  '## Executive Summary\nWe are an outstanding org driving systems change.\n\n## Needs Statement\nBy 2027, we will serve 500 youth with measurable outcomes demonstrating systems change.\n\n## Budget Narrative\nWe will spend $50,000 on staff salaries and benefits.'

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue(textResponse(revisedRawText))
})

describe('reviseApplication', () => {
  describe('skip conditions', () => {
    it('returns draft unchanged when critique has 0 items — no Claude call', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()
      const emptyCritique = makeEmptyCritique()

      const result = await reviseApplication(draft, emptyCritique, makePassInput())

      expect(createMock).not.toHaveBeenCalled()
      expect(result.rawText).toBe(draft.rawText)
      expect(result.sections).toEqual(draft.sections)
    })

    it('returns draft unchanged when critique.overallScore >= 9 — no Claude call', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()
      const excellentCritique = makeExcellentCritique()

      const result = await reviseApplication(draft, excellentCritique, makePassInput())

      expect(createMock).not.toHaveBeenCalled()
      expect(result.rawText).toBe(draft.rawText)
      expect(result.sections).toEqual(draft.sections)
    })

    it('changesLog is empty when skip condition is met (0 items)', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeEmptyCritique(), makePassInput())

      expect(result.changesLog).toEqual([])
    })

    it('changesLog is empty when skip condition is met (score >= 9)', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeExcellentCritique(), makePassInput())

      expect(result.changesLog).toEqual([])
    })
  })

  describe('Claude call', () => {
    it('makes a Claude call when critique has items and score < 9', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      expect(createMock).toHaveBeenCalledOnce()
    })

    it('calls Claude with model claude-sonnet-4-6', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.model).toBe('claude-sonnet-4-6')
    })

    it('calls Claude with max_tokens 4096', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.max_tokens).toBe(4096)
    })

    it('includes draft rawText in the prompt', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      await reviseApplication(draft, makeCritique(), makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(draft.rawText)
    })

    it('includes critique summary in the prompt', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const critique = makeCritique()

      await reviseApplication(makeDraft(), critique, makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(critique.summary)
    })

    it('includes critique items in the prompt', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const critique = makeCritique()

      await reviseApplication(makeDraft(), critique, makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(critique.items[0].suggestion)
      expect(userMessage).toContain(critique.items[1].suggestion)
    })

    it('instructs Claude to make targeted edits, not a full rewrite', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage.toLowerCase()).toContain('targeted')
    })
  })

  describe('parsing revised sections', () => {
    it('parses revised sections from ## Heading markers in response', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      expect(result.sections).toHaveLength(3)
      expect(result.sections[0].name).toBe('Executive Summary')
      expect(result.sections[1].name).toBe('Needs Statement')
      expect(result.sections[2].name).toBe('Budget Narrative')
    })

    it('populates section content from revised text', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      expect(result.sections[0].content).toContain('systems change')
      expect(result.sections[1].content).toContain('measurable outcomes')
    })

    it('calculates wordCount for each revised section', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      for (const section of result.sections) {
        expect(typeof section.wordCount).toBe('number')
        expect(section.wordCount).toBeGreaterThan(0)
      }
    })

    it('sets rawText to the full revised response text', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      expect(result.rawText).toBe(revisedRawText)
    })
  })

  describe('changesLog', () => {
    it('changesLog contains entries from the critique item suggestions', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const critique = makeCritique()

      const result = await reviseApplication(makeDraft(), critique, makePassInput())

      expect(result.changesLog.length).toBeGreaterThan(0)
      expect(result.changesLog.some((entry) => entry.includes(critique.items[0].suggestion))).toBe(true)
      expect(result.changesLog.some((entry) => entry.includes(critique.items[1].suggestion))).toBe(true)
    })

    it('changesLog has one entry per critique item addressed', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const critique = makeCritique()

      const result = await reviseApplication(makeDraft(), critique, makePassInput())

      expect(result.changesLog).toHaveLength(critique.items.length)
    })
  })

  describe('passthrough fields', () => {
    it('carries selectedAngles through from the original draft', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      const result = await reviseApplication(draft, makeCritique(), makePassInput())

      expect(result.selectedAngles).toEqual(draft.selectedAngles)
    })

    it('carries selectedFramework through from the original draft', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      const result = await reviseApplication(draft, makeCritique(), makePassInput())

      expect(result.selectedFramework).toBe(draft.selectedFramework)
    })

    it('carries researchNotes through from the original draft', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      const result = await reviseApplication(draft, makeCritique(), makePassInput())

      expect(result.researchNotes).toBe(draft.researchNotes)
    })

    it('carries passthrough fields even when skip condition is met', async () => {
      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      const result = await reviseApplication(draft, makeEmptyCritique(), makePassInput())

      expect(result.selectedAngles).toEqual(draft.selectedAngles)
      expect(result.selectedFramework).toBe(draft.selectedFramework)
      expect(result.researchNotes).toBe(draft.researchNotes)
    })
  })

  describe('error handling', () => {
    it('returns original draft when API throws — does not throw', async () => {
      createMock.mockRejectedValue(new Error('API rate limit exceeded'))

      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      const result = await reviseApplication(draft, makeCritique(), makePassInput())

      expect(result.rawText).toBe(draft.rawText)
      expect(result.sections).toEqual(draft.sections)
    })

    it('changesLog contains error entry when API throws', async () => {
      createMock.mockRejectedValue(new Error('Network error'))

      const { reviseApplication } = await import('@/lib/writing/passes/revision')

      const result = await reviseApplication(makeDraft(), makeCritique(), makePassInput())

      expect(result.changesLog).toHaveLength(1)
      expect(result.changesLog[0]).toContain('Revision pass failed')
    })

    it('still carries passthrough fields when API throws', async () => {
      createMock.mockRejectedValue(new Error('Network error'))

      const { reviseApplication } = await import('@/lib/writing/passes/revision')
      const draft = makeDraft()

      const result = await reviseApplication(draft, makeCritique(), makePassInput())

      expect(result.selectedAngles).toEqual(draft.selectedAngles)
      expect(result.selectedFramework).toBe(draft.selectedFramework)
      expect(result.researchNotes).toBe(draft.researchNotes)
    })
  })
})
