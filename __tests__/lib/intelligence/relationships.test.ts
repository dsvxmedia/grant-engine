import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

const anthropicCreateMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: anthropicCreateMock }
  },
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

describe('getDueOutreachWindows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns [] when no grant cycles are due', async () => {
    const chainObj = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    const from = vi.fn().mockReturnValue(chainObj)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { getDueOutreachWindows } = await import('@/lib/intelligence/relationships')
    const result = await getDueOutreachWindows()

    expect(result).toEqual([])
  })

  it('returns windows when cycles are due', async () => {
    const rows = [
      {
        predicted_next_open: '2026-06-01',
        grants: { title: 'Tech Grant', funder_name: 'Acme Foundation' },
      },
    ]
    const chainObj = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: typeof rows; error: null }) => void) =>
        resolve({ data: rows, error: null }),
    }
    const from = vi.fn().mockReturnValue(chainObj)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { getDueOutreachWindows } = await import('@/lib/intelligence/relationships')
    const result = await getDueOutreachWindows()

    expect(result).toHaveLength(1)
    expect(result[0].funderName).toBe('Acme Foundation')
    expect(result[0].grantTitle).toBe('Tech Grant')
    expect(result[0].predictedOpenDate).toBe('2026-06-01')
  })
})

describe('draftOutreachEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns email draft from Claude on success', async () => {
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: 'We are a tech nonprofit serving underrepresented communities.' }],
    })

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { draftOutreachEmail } = await import('@/lib/intelligence/relationships')
    const draft = await draftOutreachEmail('Acme Foundation', 'Tech for all communities')

    expect(draft.body).toContain('We are a tech nonprofit')
    expect(draft.to).toBe('Acme Foundation')
    expect(draft.subject).toBeTruthy()
  })

  it('returns template draft when Claude fails', async () => {
    anthropicCreateMock.mockRejectedValue(new Error('API error'))

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { draftOutreachEmail } = await import('@/lib/intelligence/relationships')
    const draft = await draftOutreachEmail('Some Funder', 'Our mission here')

    expect(draft.to).toBeTruthy()
    expect(draft.subject).toBeTruthy()
    expect(draft.body).toBeTruthy()
    // Template body should still be a non-empty string
    expect(draft.body.length).toBeGreaterThan(10)
  })
})

describe('logContact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does not throw when Supabase update succeeds', async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (v: { error: null }) => void) => resolve({ error: null }),
    }
    const from = vi.fn().mockReturnValue(updateChain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { logContact } = await import('@/lib/intelligence/relationships')
    await expect(logContact('po-1', 'email', 'Great call')).resolves.toBeUndefined()
  })

  it('does not throw when Supabase update fails', async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (v: { error: { message: string } }) => void) =>
        resolve({ error: { message: 'Update failed' } }),
    }
    const from = vi.fn().mockReturnValue(updateChain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { logContact } = await import('@/lib/intelligence/relationships')
    await expect(logContact('po-1', 'email', 'Notes')).resolves.toBeUndefined()
  })
})
