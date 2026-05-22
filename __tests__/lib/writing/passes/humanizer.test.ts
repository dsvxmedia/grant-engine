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

function makeRevision() {
  return {
    sections: [
      { name: 'Executive Summary', content: 'We are a great org doing great things.', wordCount: 8 },
      { name: 'Needs Statement', content: 'The need is real and documented.', wordCount: 7 },
      { name: 'Budget Narrative', content: 'We will spend $50,000 on staff.', wordCount: 8 },
    ],
    rawText:
      '## Executive Summary\nWe are a great org doing great things.\n\n## Needs Statement\nThe need is real and documented.\n\n## Budget Narrative\nWe will spend $50,000 on staff.',
    changesLog: ['Added SMART objectives.', 'Incorporated funder language.'],
    selectedAngles: ['minority-owned enterprise', 'workforce pipeline'],
    selectedFramework: 'theory-of-change',
    researchNotes: '{"funderBackground":"Test funder"}',
  }
}

const humanizedRawText =
  '## Executive Summary\nOur organization drives real change — every day.\n\n## Needs Statement\nYouth unemployment hits hard. The numbers prove it.\n\n## Budget Narrative\nWe will spend $50,000 on staff salaries and benefits.'

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue(textResponse(humanizedRawText))
})

describe('humanizeApplication', () => {
  describe('parsing humanized sections', () => {
    it('returns sections by parsing ## Heading markers in Claude response', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.sections).toHaveLength(3)
      expect(result.sections[0].name).toBe('Executive Summary')
      expect(result.sections[1].name).toBe('Needs Statement')
      expect(result.sections[2].name).toBe('Budget Narrative')
    })

    it('populates section content from the humanized text', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      const result = await humanizeApplication(makeRevision(), null)

      expect(result.sections[0].content).toContain('real change')
      expect(result.sections[1].content).toContain('Youth unemployment')
    })

    it('sets rawText to the full humanized response text', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      const result = await humanizeApplication(makeRevision(), null)

      expect(result.rawText).toBe(humanizedRawText)
    })
  })

  describe('humanizerApplied flag', () => {
    it('sets humanizerApplied: true on successful run', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      const result = await humanizeApplication(makeRevision(), null)

      expect(result.humanizerApplied).toBe(true)
    })

    it('sets humanizerApplied: false when API throws', async () => {
      createMock.mockRejectedValue(new Error('API rate limit'))

      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      const result = await humanizeApplication(makeRevision(), null)

      expect(result.humanizerApplied).toBe(false)
    })
  })

  describe('error handling', () => {
    it('returns original sections when API throws — does not re-throw', async () => {
      createMock.mockRejectedValue(new Error('API rate limit'))

      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.sections).toEqual(revision.sections)
      expect(result.rawText).toBe(revision.rawText)
    })

    it('does not throw when API fails', async () => {
      createMock.mockRejectedValue(new Error('Network error'))

      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      await expect(humanizeApplication(makeRevision(), null)).resolves.not.toThrow()
    })
  })

  describe('passthrough fields', () => {
    it('carries changesLog through from the revision', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.changesLog).toEqual(revision.changesLog)
    })

    it('carries selectedAngles through from the revision', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.selectedAngles).toEqual(revision.selectedAngles)
    })

    it('carries selectedFramework through from the revision', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.selectedFramework).toBe(revision.selectedFramework)
    })

    it('carries researchNotes through from the revision', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.researchNotes).toBe(revision.researchNotes)
    })

    it('carries passthrough fields even when API throws', async () => {
      createMock.mockRejectedValue(new Error('Network error'))

      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      const result = await humanizeApplication(revision, null)

      expect(result.changesLog).toEqual(revision.changesLog)
      expect(result.selectedAngles).toEqual(revision.selectedAngles)
      expect(result.selectedFramework).toBe(revision.selectedFramework)
      expect(result.researchNotes).toBe(revision.researchNotes)
    })
  })

  describe('founder voice', () => {
    it('includes founderVoice in the prompt when provided', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const founderVoice =
        'Our founder grew up in the neighborhood he now serves, shaped by the same barriers his clients face.'

      await humanizeApplication(makeRevision(), founderVoice)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(founderVoice)
    })

    it('does not include founderVoice context when founderVoice is null', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      await humanizeApplication(makeRevision(), null)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).not.toContain('Founder Voice')
    })
  })

  describe('Claude call configuration', () => {
    it('calls Claude with model claude-sonnet-4-6', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      await humanizeApplication(makeRevision(), null)

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.model).toBe('claude-sonnet-4-6')
    })

    it('calls Claude with max_tokens 4096', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')

      await humanizeApplication(makeRevision(), null)

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.max_tokens).toBe(4096)
    })

    it('includes the revision rawText in the prompt', async () => {
      const { humanizeApplication } = await import('@/lib/writing/passes/humanizer')
      const revision = makeRevision()

      await humanizeApplication(revision, null)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(revision.rawText)
    })
  })
})
