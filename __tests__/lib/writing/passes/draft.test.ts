import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))

vi.mock('@/lib/writing/system-prompt', () => ({
  getGrantWriterSystemPromptBlocks: vi.fn(() => [
    { type: 'text', text: 'System prompt text', cache_control: { type: 'ephemeral' } },
  ]),
}))

vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

function textResponse(text: string) {
  return { content: [{ type: 'text', text }] }
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
      grant_narrative: 'Birmingham Youth Collective builds economic pathways for young people through workforce development and entrepreneurship programming.',
    },
    founderName: 'Test Founder',
    founderStory: 'Our founder started this organization after witnessing youth unemployment firsthand.',
    research: {
      funderBackground: 'Acme Foundation focuses on economic mobility in the Southeast.',
      previousRecipients: ['Community Works', 'Hope Center'],
      evaluationCriteria: ['community impact', 'organizational capacity', 'budget clarity'],
      requiredSections: ['Executive Summary', 'Needs Statement', 'Budget'],
      wordLimits: { 'Executive Summary': 250, 'Needs Statement': 600, Budget: 300 },
      selectedFramework: 'theory-of-change' as const,
      funderLanguage: ['equity-centered', 'community partners', 'systems change'],
      rawNotes: 'Guidelines fetched from Acme Foundation website.',
    },
    matchedAngles: ['minority-owned enterprise', 'workforce pipeline', 'youth economic mobility'],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue(
    textResponse(
      '## Executive Summary\nHello world. This is a great org.\n\n## Needs Statement\nThe problem is real and urgent.'
    )
  )
})

describe('generateFirstDraft', () => {
  describe('section parsing', () => {
    it('returns sections by parsing ## Heading markers', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const result = await generateFirstDraft(makePassInput())

      expect(Array.isArray(result.sections)).toBe(true)
      expect(result.sections.length).toBe(2)
      expect(result.sections[0].name).toBe('Executive Summary')
      expect(result.sections[1].name).toBe('Needs Statement')
    })

    it('captures content for each section', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const result = await generateFirstDraft(makePassInput())

      expect(result.sections[0].content).toContain('Hello world')
      expect(result.sections[1].content).toContain('The problem is real')
    })

    it('computes wordCount per section', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const result = await generateFirstDraft(makePassInput())

      // "Hello world. This is a great org." = 7 words
      expect(result.sections[0].wordCount).toBe(7)
      // "The problem is real and urgent." = 6 words
      expect(result.sections[1].wordCount).toBe(6)
    })

    it('falls back to single "Full Draft" section when no ## headings in response', async () => {
      createMock.mockResolvedValue(textResponse('This is a draft with no section markers at all.'))

      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const result = await generateFirstDraft(makePassInput())

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].name).toBe('Full Draft')
      expect(result.sections[0].content).toContain('no section markers')
    })

    it('includes rawText with the full response text', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const result = await generateFirstDraft(makePassInput())

      expect(result.rawText).toContain('Executive Summary')
      expect(result.rawText).toContain('Needs Statement')
    })
  })

  describe('output metadata', () => {
    it('returns selectedAngles from input.matchedAngles', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()
      const result = await generateFirstDraft(input)

      expect(result.selectedAngles).toEqual(input.matchedAngles)
    })

    it('returns selectedFramework from input.research.selectedFramework', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const result = await generateFirstDraft(makePassInput())

      expect(result.selectedFramework).toBe('theory-of-change')
    })

    it('returns researchNotes as a JSON string of research findings', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()
      const result = await generateFirstDraft(input)

      const parsed = JSON.parse(result.researchNotes)
      expect(parsed.funderBackground).toBe(input.research.funderBackground)
      expect(parsed.selectedFramework).toBe(input.research.selectedFramework)
    })
  })

  describe('Claude API call', () => {
    it('calls Claude with the system prompt blocks', async () => {
      const { getGrantWriterSystemPromptBlocks } = await import('@/lib/writing/system-prompt')
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')

      await generateFirstDraft(makePassInput())

      expect(createMock).toHaveBeenCalledOnce()
      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.system).toEqual(getGrantWriterSystemPromptBlocks())
    })

    it('calls Claude with model claude-sonnet-4-6', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')

      await generateFirstDraft(makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.model).toBe('claude-sonnet-4-6')
    })

    it('calls Claude with max_tokens 4096', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')

      await generateFirstDraft(makePassInput())

      const callArgs = createMock.mock.calls[0][0]
      expect(callArgs.max_tokens).toBe(4096)
    })

    it('includes grant title and funder name in user prompt', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(input.grant.title)
      expect(userMessage).toContain(input.grant.funder_name!)
    })

    it('includes matched angles in user prompt', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain('minority-owned enterprise')
      expect(userMessage).toContain('workforce pipeline')
    })

    it('includes entity name in user prompt', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain(input.entity.name)
    })

    it('includes funder language in user prompt for language mirroring', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain('equity-centered')
    })

    it('includes word limits in user prompt', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      // Word limit for Executive Summary is 250
      expect(userMessage).toContain('250')
    })

    it('includes founder story in user prompt when provided', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain('witnessing youth unemployment')
    })

    it('includes grant narrative in user prompt when provided', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = makePassInput()

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).toContain('Birmingham Youth Collective builds economic pathways')
      expect(userMessage).toContain('Organization Narrative')
    })

    it('omits narrative section when grant_narrative is null', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = { ...makePassInput(), entity: { ...makePassInput().entity, grant_narrative: null } }

      await generateFirstDraft(input)

      const callArgs = createMock.mock.calls[0][0]
      const userMessage = callArgs.messages[0].content as string
      expect(userMessage).not.toContain('Organization Narrative')
    })
  })

  describe('error handling', () => {
    it('throws with message "Pass 1 (draft) failed: ..." when Claude API fails', async () => {
      createMock.mockRejectedValue(new Error('API rate limit exceeded'))

      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')

      await expect(generateFirstDraft(makePassInput())).rejects.toThrow(
        'Pass 1 (draft) failed: API rate limit exceeded'
      )
    })

    it('throws with a Pass 1 prefix for any error type', async () => {
      createMock.mockRejectedValue(new Error('Connection timeout'))

      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')

      await expect(generateFirstDraft(makePassInput())).rejects.toThrow('Pass 1 (draft) failed:')
    })
  })

  describe('null founderStory', () => {
    it('does not throw when founderStory is null', async () => {
      const { generateFirstDraft } = await import('@/lib/writing/passes/draft')
      const input = { ...makePassInput(), founderStory: null }

      await expect(generateFirstDraft(input)).resolves.not.toThrow()
    })
  })
})
