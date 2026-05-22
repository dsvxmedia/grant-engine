import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QAInput } from '@/lib/qa/types'

const createMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))
vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

function makeQAInput(overrides: Partial<QAInput> = {}): QAInput {
  return {
    applicationId: 'app-001',
    draftText: 'We are a minority-owned tech company building solutions for underserved communities.',
    grantTitle: 'Community Innovation Fund',
    funderType: 'foundation',
    requiredSections: ['Executive Summary', 'Project Description', 'Budget'],
    wordLimits: { 'Executive Summary': 300 },
    qaRetryCount: 0,
    ...overrides,
  }
}

function jsonResponse(score: number, issues: string[]) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ score, issues }) }],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('scoreClarity', () => {
  it('returns parsed QAScore when Claude returns valid JSON', async () => {
    createMock.mockResolvedValue(jsonResponse(7.5, ['Some jargon detected']))

    const { scoreClarity } = await import('@/lib/qa/clarity')
    const result = await scoreClarity(makeQAInput())

    expect(result.score).toBe(7.5)
    expect(result.issues).toEqual(['Some jargon detected'])
    expect(result.passed).toBe(true)
  })

  it('uses claude-haiku-4-5-20251001 model', async () => {
    createMock.mockResolvedValue(jsonResponse(8.0, []))

    const { scoreClarity } = await import('@/lib/qa/clarity')
    await scoreClarity(makeQAInput())

    expect(createMock).toHaveBeenCalledOnce()
    const callArgs = createMock.mock.calls[0][0]
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001')
  })

  it('returns fallback on parse failure (never throws)', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: 'Not JSON at all' }],
    })

    const { scoreClarity } = await import('@/lib/qa/clarity')
    const result = await scoreClarity(makeQAInput())

    expect(result.score).toBe(5)
    expect(result.issues).toEqual(['Clarity scoring failed'])
    expect(result.passed).toBe(false)
  })

  it('returns fallback on API error (never throws)', async () => {
    createMock.mockRejectedValue(new Error('Network error'))

    const { scoreClarity } = await import('@/lib/qa/clarity')
    const result = await scoreClarity(makeQAInput())

    expect(result.score).toBe(5)
    expect(result.issues).toEqual(['Clarity scoring failed'])
    expect(result.passed).toBe(false)
  })
})
