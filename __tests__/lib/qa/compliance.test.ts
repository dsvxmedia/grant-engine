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
    draftText: 'Executive Summary: We are a tech company.\nProject Description: We build solutions.\nBudget: $50,000 for personnel.',
    grantTitle: 'Community Innovation Fund',
    funderType: 'foundation',
    requiredSections: ['Executive Summary', 'Project Description', 'Budget'],
    wordLimits: { 'Executive Summary': 300, 'Project Description': 1000 },
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

describe('scoreCompliance', () => {
  it('returns parsed QAScore when Claude returns valid JSON', async () => {
    createMock.mockResolvedValue(jsonResponse(9.0, []))

    const { scoreCompliance } = await import('@/lib/qa/compliance')
    const result = await scoreCompliance(makeQAInput())

    expect(result.score).toBe(9.0)
    expect(result.issues).toEqual([])
    expect(result.passed).toBe(true)
  })

  it('uses claude-haiku-4-5-20251001 model', async () => {
    createMock.mockResolvedValue(jsonResponse(8.0, []))

    const { scoreCompliance } = await import('@/lib/qa/compliance')
    await scoreCompliance(makeQAInput())

    expect(createMock).toHaveBeenCalledOnce()
    const callArgs = createMock.mock.calls[0][0]
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001')
  })

  it('returns fallback on parse failure (never throws)', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: 'invalid json here' }],
    })

    const { scoreCompliance } = await import('@/lib/qa/compliance')
    const result = await scoreCompliance(makeQAInput())

    expect(result.score).toBe(5)
    expect(result.issues).toEqual(['Compliance scoring failed'])
    expect(result.passed).toBe(false)
  })

  it('returns fallback on API error (never throws)', async () => {
    createMock.mockRejectedValue(new Error('Timeout'))

    const { scoreCompliance } = await import('@/lib/qa/compliance')
    const result = await scoreCompliance(makeQAInput())

    expect(result.score).toBe(5)
    expect(result.issues).toEqual(['Compliance scoring failed'])
    expect(result.passed).toBe(false)
  })
})
