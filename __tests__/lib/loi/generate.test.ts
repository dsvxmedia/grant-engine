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

function baseInput() {
  return {
    grant: {
      title: 'Foundation Innovation Grant',
      funder_name: 'Acme Foundation',
      description: 'Funding for community innovation projects',
      eligibility_text: '501(c)(3) organizations only',
      award_min: 25000,
      award_max: 100000,
      loi_deadline: '2026-09-15',
    },
    entity: {
      name: 'Birmingham Youth Collective',
      mission: 'Build pathways for urban youth',
      focus_area: 'Workforce development',
      state: 'AL',
      city: 'Birmingham',
      who_we_serve: ['urban youth', 'first-generation students'],
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateLoi', () => {
  it('generates LOI content from grant and entity', async () => {
    createMock.mockResolvedValue(
      textResponse('Dear Foundation, We are pleased to introduce our organization and its work.')
    )

    const { generateLoi } = await import('@/lib/loi/generate')
    const result = await generateLoi(baseInput())

    expect(typeof result.content).toBe('string')
    expect(result.content.length).toBeGreaterThan(0)
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('includes grant title in prompt', async () => {
    createMock.mockResolvedValue(textResponse('LOI text here.'))

    const { generateLoi } = await import('@/lib/loi/generate')
    await generateLoi(baseInput())

    const call = createMock.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).toContain('Foundation Innovation Grant')
  })

  it('includes entity name in prompt', async () => {
    createMock.mockResolvedValue(textResponse('LOI text here.'))

    const { generateLoi } = await import('@/lib/loi/generate')
    await generateLoi(baseInput())

    const call = createMock.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).toContain('Birmingham Youth Collective')
  })

  it('includes founder story when provided', async () => {
    createMock.mockResolvedValue(textResponse('LOI text here.'))

    const { generateLoi } = await import('@/lib/loi/generate')
    await generateLoi({
      ...baseInput(),
      founderStory: 'I started this company after watching my community lose access to opportunity.',
    })

    const call = createMock.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).toContain('I started this company after')
  })

  it('omits founder story when not provided', async () => {
    createMock.mockResolvedValue(textResponse('LOI text here.'))

    const { generateLoi } = await import('@/lib/loi/generate')
    await generateLoi(baseInput())

    const call = createMock.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).not.toContain('Founder background')
  })

  it('uses claude-sonnet-4-6 model', async () => {
    createMock.mockResolvedValue(textResponse('LOI text here.'))

    const { generateLoi } = await import('@/lib/loi/generate')
    await generateLoi(baseInput())

    const call = createMock.mock.calls[0][0]
    expect(call.model).toBe('claude-sonnet-4-6')
  })

  it('throws descriptive error on API failure', async () => {
    createMock.mockRejectedValue(new Error('rate limit'))

    const { generateLoi } = await import('@/lib/loi/generate')
    await expect(generateLoi(baseInput())).rejects.toThrow(/LOI generation failed/)
  })

  it('wordCount matches actual word count', async () => {
    createMock.mockResolvedValue(
      textResponse('one two three four five six seven eight nine ten')
    )

    const { generateLoi } = await import('@/lib/loi/generate')
    const result = await generateLoi(baseInput())
    expect(result.wordCount).toBe(10)
  })
})
