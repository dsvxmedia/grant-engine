import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VideoInput } from '@/lib/video/types'

// ─── Anthropic mock ───────────────────────────────────────────────────────────
// The create spy must be defined before the module mock factory runs.
const createSpy = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: createSpy }
  }
  return { default: MockAnthropic }
})

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'test-key' },
}))

// ─── Fixture factories ────────────────────────────────────────────────────────

function makeVideoInput(): VideoInput {
  return {
    grant: {
      title: 'Community Tech Grant',
      funder_name: 'Acme Foundation',
      description: 'A grant for tech startups serving underserved communities.',
      award_min: 25000,
      award_max: 75000,
      deadline: '2026-12-01',
    },
    entity: {
      name: 'Test Tech Corp',
      mission: 'Empowering minority tech entrepreneurs.',
      focus_area: 'technology',
      who_we_serve: ['minority-owned businesses'],
    },
    founderName: 'Jane Doe',
    founderStory: 'I started this company because I saw a gap in the market.',
    requestedAmount: 50000,
  }
}

function makeValidScriptResponse() {
  return {
    sections: [
      { name: 'Intro', text: 'Hi, I am Jane Doe from Test Tech Corp.', durationSeconds: 15 },
      { name: 'Problem', text: 'Minority entrepreneurs face a significant gap in tech access.', durationSeconds: 30 },
      { name: 'Solution', text: 'Test Tech Corp builds tools that empower minority-owned businesses.', durationSeconds: 45 },
      { name: 'Impact', text: 'We serve over 200 minority-owned businesses across the region.', durationSeconds: 30 },
      { name: 'Ask', text: 'We are requesting $50,000 to expand our training program.', durationSeconds: 20 },
      { name: 'Close', text: 'Acme Foundation is the right partner because you believe in equity.', durationSeconds: 10 },
    ],
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateVideoScript', () => {
  it('returns a parsed VideoScript when Claude returns valid JSON', async () => {
    createSpy.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(makeValidScriptResponse()) }],
    })

    const { generateVideoScript } = await import('@/lib/video/script')
    const result = await generateVideoScript(makeVideoInput())

    expect(result.sections).toHaveLength(6)
    expect(result.sections[0].name).toBe('Intro')
    expect(result.sections[0].text).toContain('Jane Doe')
  })

  it('computes spokenText by joining section texts', async () => {
    createSpy.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(makeValidScriptResponse()) }],
    })

    const { generateVideoScript } = await import('@/lib/video/script')
    const result = await generateVideoScript(makeVideoInput())

    const expectedSpokenText = makeValidScriptResponse().sections
      .map((s) => s.text)
      .join(' ')
    expect(result.spokenText).toBe(expectedSpokenText)
  })

  it('falls back to a minimal template on parse failure — never throws', async () => {
    createSpy.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not JSON at all.' }],
    })

    const { generateVideoScript } = await import('@/lib/video/script')
    const result = await generateVideoScript(makeVideoInput())

    // Should return a minimal but valid VideoScript
    expect(result.sections.length).toBeGreaterThan(0)
    expect(result.spokenText).toBeTruthy()
    expect(result.wordCount).toBeGreaterThan(0)
    expect(result.totalDurationSeconds).toBeGreaterThan(0)
  })

  it('falls back to a minimal template on API failure — never throws', async () => {
    createSpy.mockRejectedValue(new Error('API connection timeout'))

    const { generateVideoScript } = await import('@/lib/video/script')
    const result = await generateVideoScript(makeVideoInput())

    // Should return a minimal but valid VideoScript
    expect(result.sections.length).toBeGreaterThan(0)
    expect(result.spokenText).toBeTruthy()
    expect(result.totalDurationSeconds).toBeGreaterThan(0)
  })

  it('includes founderName in the prompt context sent to Claude', async () => {
    createSpy.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(makeValidScriptResponse()) }],
    })

    const { generateVideoScript } = await import('@/lib/video/script')
    await generateVideoScript(makeVideoInput())

    expect(createSpy).toHaveBeenCalledOnce()
    const callArg = createSpy.mock.calls[0][0]
    const promptText = JSON.stringify(callArg)
    expect(promptText).toContain('Jane Doe')
  })

  it('totalDurationSeconds equals the sum of section durations', async () => {
    createSpy.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(makeValidScriptResponse()) }],
    })

    const { generateVideoScript } = await import('@/lib/video/script')
    const result = await generateVideoScript(makeVideoInput())

    const expectedTotal = makeValidScriptResponse().sections.reduce(
      (sum, s) => sum + s.durationSeconds,
      0
    )
    expect(result.totalDurationSeconds).toBe(expectedTotal)
  })
})
