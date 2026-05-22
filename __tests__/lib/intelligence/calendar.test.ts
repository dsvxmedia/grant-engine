import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

describe('recordGrantCycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('computes predicted_next_open as open date + 1 year', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert: upsertSpy })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { recordGrantCycle } = await import('@/lib/intelligence/calendar')
    await recordGrantCycle('grant-1', '2025-03-01', '2025-04-01')

    expect(upsertSpy).toHaveBeenCalledOnce()
    const upsertArg = upsertSpy.mock.calls[0][0]
    expect(upsertArg.predicted_next_open).toBe('2026-03-01')
  })

  it('sets year to current year', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert: upsertSpy })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { recordGrantCycle } = await import('@/lib/intelligence/calendar')
    await recordGrantCycle('grant-1', '2025-03-01', '2025-04-01')

    const upsertArg = upsertSpy.mock.calls[0][0]
    expect(upsertArg.year).toBe(new Date().getFullYear())
  })

  it('does not throw when Supabase returns error', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } })
    const from = vi.fn().mockReturnValue({ upsert: upsertSpy })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { recordGrantCycle } = await import('@/lib/intelligence/calendar')
    await expect(recordGrantCycle('grant-1', '2025-03-01', '2025-04-01')).resolves.toBeUndefined()
  })
})

describe('getUpcomingGrants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns [] when no grants are due within the window', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    const from = vi.fn().mockReturnValue(chain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { getUpcomingGrants } = await import('@/lib/intelligence/calendar')
    const result = await getUpcomingGrants(30)

    expect(result).toEqual([])
  })

  it('returns cycle records when grants are upcoming', async () => {
    const rows = [
      {
        grant_id: 'grant-1',
        year: 2025,
        open_date: '2025-03-01',
        close_date: '2025-04-01',
        predicted_next_open: '2026-03-01',
      },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: (resolve: (v: { data: typeof rows; error: null }) => void) =>
        resolve({ data: rows, error: null }),
    }
    const from = vi.fn().mockReturnValue(chain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { getUpcomingGrants } = await import('@/lib/intelligence/calendar')
    const result = await getUpcomingGrants(30)

    expect(result).toHaveLength(1)
    expect(result[0].grantId).toBe('grant-1')
    expect(result[0].predictedNextOpen).toBe('2026-03-01')
  })
})

describe('predictNextOpen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null when no cycle record exists', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const from = vi.fn().mockReturnValue(chain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { predictNextOpen } = await import('@/lib/intelligence/calendar')
    const result = await predictNextOpen('grant-999')

    expect(result).toBeNull()
  })

  it('returns predicted_next_open when record exists', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { predicted_next_open: '2026-05-01' },
        error: null,
      }),
    }
    const from = vi.fn().mockReturnValue(chain)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { predictNextOpen } = await import('@/lib/intelligence/calendar')
    const result = await predictNextOpen('grant-1')

    expect(result).toBe('2026-05-01')
  })
})
