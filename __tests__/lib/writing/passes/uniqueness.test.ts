import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockGte = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))

function makeHumanized(rawText = 'Some grant application text about workforce development.') {
  return {
    sections: [
      { name: 'Executive Summary', content: 'We do great work.', wordCount: 5 },
      { name: 'Needs Statement', content: 'The need is real.', wordCount: 5 },
    ],
    rawText,
    changesLog: ['Added SMART objectives.', 'Incorporated funder language.'],
    selectedAngles: ['minority-owned enterprise', 'workforce pipeline'],
    selectedFramework: 'theory-of-change',
    researchNotes: '{"funderBackground":"Test funder"}',
    humanizerApplied: true,
  }
}

function makeSupabaseClient(result: { data: unknown; error: unknown }): SupabaseClient {
  mockGte.mockResolvedValue(result)
  mockSelect.mockReturnValue({ gte: mockGte })
  mockFrom.mockReturnValue({ select: mockSelect })
  return { from: mockFrom } as unknown as SupabaseClient
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('checkUniqueness', () => {
  describe('empty database', () => {
    it('returns uniquenessScore: 1.0 when no existing applications found', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized())

      expect(result.uniquenessScore).toBe(1.0)
    })

    it('returns needsRevision: false when no existing applications found', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized())

      expect(result.needsRevision).toBe(false)
    })
  })

  describe('Supabase error handling', () => {
    it('returns uniquenessScore: 1.0 when Supabase query errors', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: null, error: new Error('DB connection failed') }) as ReturnType<
          typeof makeSupabaseClient
        >
      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized())

      expect(result.uniquenessScore).toBe(1.0)
    })

    it('returns needsRevision: false when Supabase query errors', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: null, error: new Error('DB connection failed') }) as ReturnType<
          typeof makeSupabaseClient
        >
      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized())

      expect(result.needsRevision).toBe(false)
    })

    it('does not throw when Supabase query errors', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: null, error: new Error('DB connection failed') }) as ReturnType<
          typeof makeSupabaseClient
        >
      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')

      await expect(checkUniqueness(makeHumanized())).resolves.not.toThrow()
    })
  })

  describe('similarity scoring', () => {
    it('computes low uniqueness score when existing application has high keyword overlap', async () => {
      const rawText =
        'workforce development program serving minority owned businesses in technology sector grant funding'
      const existingDraftContent = {
        'Executive Summary':
          'workforce development program serving minority owned businesses in technology sector grant funding',
      }

      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({
          data: [{ draft_content: existingDraftContent }],
          error: null,
        })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized(rawText))

      expect(result.uniquenessScore).toBeLessThan(0.5)
    })

    it('sets needsRevision: true when similarity > 0.85', async () => {
      // Near-identical text to trigger > 0.85 similarity
      const identicalText =
        'workforce development minority owned technology enterprise mission impact community serve youth employment'
      const existingDraftContent = {
        'Executive Summary':
          'workforce development minority owned technology enterprise mission impact community serve youth employment',
      }

      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({
          data: [{ draft_content: existingDraftContent }],
          error: null,
        })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized(identicalText))

      expect(result.needsRevision).toBe(true)
    })

    it('sets needsRevision: false when similarity <= 0.85', async () => {
      const uniqueText =
        'This application addresses food security and hunger relief in rural agricultural communities through sustainable farming initiatives and local food banks.'
      const existingDraftContent = {
        'Executive Summary':
          'workforce development program serving minority owned businesses in technology sector for economic mobility',
      }

      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({
          data: [{ draft_content: existingDraftContent }],
          error: null,
        })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const result = await checkUniqueness(makeHumanized(uniqueText))

      expect(result.needsRevision).toBe(false)
    })
  })

  describe('passthrough fields', () => {
    it('carries through sections from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.sections).toEqual(humanized.sections)
    })

    it('carries through rawText from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.rawText).toBe(humanized.rawText)
    })

    it('carries through changesLog from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.changesLog).toEqual(humanized.changesLog)
    })

    it('carries through selectedAngles from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.selectedAngles).toEqual(humanized.selectedAngles)
    })

    it('carries through selectedFramework from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.selectedFramework).toBe(humanized.selectedFramework)
    })

    it('carries through researchNotes from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.researchNotes).toBe(humanized.researchNotes)
    })

    it('carries through humanizerApplied from HumanizerOutput', async () => {
      const { createServiceClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceClient).mockResolvedValue(
        makeSupabaseClient({ data: [], error: null })      )

      const { checkUniqueness } = await import('@/lib/writing/passes/uniqueness')
      const humanized = makeHumanized()
      const result = await checkUniqueness(humanized)

      expect(result.humanizerApplied).toBe(humanized.humanizerApplied)
    })
  })
})
