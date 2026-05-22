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
    draftText: 'We are a minority-owned tech company building solutions for underserved communities. Our project will serve 500 families in Detroit.',
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

describe('scoreNarrative', () => {
  it('returns parsed QAScore when Claude returns valid JSON', async () => {
    createMock.mockResolvedValue(jsonResponse(8.0, ['Equity framing could be more specific']))

    const { scoreNarrative } = await import('@/lib/qa/narrative')
    const result = await scoreNarrative(makeQAInput())

    expect(result.score).toBe(8.0)
    expect(result.issues).toEqual(['Equity framing could be more specific'])
    expect(result.passed).toBe(true)
  })

  it('clamps score to max 10', async () => {
    createMock.mockResolvedValue(jsonResponse(15, []))

    const { scoreNarrative } = await import('@/lib/qa/narrative')
    const result = await scoreNarrative(makeQAInput())

    expect(result.score).toBe(10)
  })

  it('sets passed: true when score >= 7.0', async () => {
    createMock.mockResolvedValue(jsonResponse(7.0, []))

    const { scoreNarrative } = await import('@/lib/qa/narrative')
    const result = await scoreNarrative(makeQAInput())

    expect(result.passed).toBe(true)
  })

  it('sets passed: false when score < 7.0', async () => {
    createMock.mockResolvedValue(jsonResponse(6.9, ['Weak story arc']))

    const { scoreNarrative } = await import('@/lib/qa/narrative')
    const result = await scoreNarrative(makeQAInput())

    expect(result.passed).toBe(false)
  })

  it('returns fallback on parse failure (never throws)', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not valid JSON' }],
    })

    const { scoreNarrative } = await import('@/lib/qa/narrative')
    const result = await scoreNarrative(makeQAInput())

    expect(result.score).toBe(5)
    expect(result.issues).toEqual(['Narrative scoring failed'])
    expect(result.passed).toBe(false)
  })

  it('returns fallback on API failure (never throws)', async () => {
    createMock.mockRejectedValue(new Error('API rate limit'))

    const { scoreNarrative } = await import('@/lib/qa/narrative')
    const result = await scoreNarrative(makeQAInput())

    expect(result.score).toBe(5)
    expect(result.issues).toEqual(['Narrative scoring failed'])
    expect(result.passed).toBe(false)
  })
})
