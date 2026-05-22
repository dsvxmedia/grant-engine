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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateAngles', () => {
  it('returns string array from Claude response', async () => {
    const angles = [
      'African American tech founder building tools for underserved communities',
      'First-generation entrepreneur serving urban youth',
      'Community-based nonprofit creating economic opportunity',
      'Social enterprise focused on workforce development',
      'Minority-owned business expanding broadband access',
    ]
    createMock.mockResolvedValue(textResponse(JSON.stringify(angles)))

    const { generateAngles } = await import('@/lib/profile/angles')
    const result = await generateAngles({ name: 'Acme Corp' })
    expect(result).toEqual(angles)
  })

  it('returns at least the angles Claude provides', async () => {
    const angles = ['a', 'b', 'c', 'd', 'e']
    createMock.mockResolvedValue(textResponse(JSON.stringify(angles)))

    const { generateAngles } = await import('@/lib/profile/angles')
    const result = await generateAngles({ name: 'Acme Corp' })
    expect(result.length).toBeGreaterThanOrEqual(5)
  })

  it('throws on JSON parse failure', async () => {
    createMock.mockResolvedValue(textResponse('not json at all'))

    const { generateAngles } = await import('@/lib/profile/angles')
    await expect(generateAngles({ name: 'Acme Corp' })).rejects.toThrow()
  })

  it('builds prompt including entity name', async () => {
    createMock.mockResolvedValue(textResponse('["a","b","c","d","e"]'))

    const { generateAngles } = await import('@/lib/profile/angles')
    await generateAngles({ name: 'Birmingham Youth Collective' })

    const call = createMock.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).toContain('Birmingham Youth Collective')
  })

  it('builds prompt including eligibility attributes when present', async () => {
    createMock.mockResolvedValue(textResponse('["a","b","c","d","e"]'))

    const { generateAngles } = await import('@/lib/profile/angles')
    await generateAngles({
      name: 'Acme Corp',
      is_african_american_owned: true,
      mission: 'Build tools for underserved communities',
      city: 'Atlanta',
    })

    const call = createMock.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent.toLowerCase()).toContain('african american')
    expect(userContent).toContain('Build tools for underserved communities')
    expect(userContent).toContain('Atlanta')
  })

  it('handles null/missing optional fields without error', async () => {
    createMock.mockResolvedValue(textResponse('["a","b","c","d","e"]'))

    const { generateAngles } = await import('@/lib/profile/angles')
    const result = await generateAngles({ name: 'Bare Minimum LLC' })
    expect(result.length).toBe(5)
  })
})
