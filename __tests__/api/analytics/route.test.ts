import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('GET /api/analytics', () => {
  it('returns all expected analytics fields', async () => {
    // Each query uses: .from(table).select(..., { count: 'exact', head: true }).eq(...)
    // We need to handle multiple chained calls based on table and filters
    let callIndex = 0
    const results = [
      { count: 42, error: null },  // discovered: grants active
      { count: 15, error: null },  // applied: grant_applications submitted
      { count: 5, error: null },   // won: outcome awarded
      { count: 3, error: null },   // rejected: outcome rejected
      { data: [{ award_max: 10000 }, { award_max: 20000 }], error: null }, // pipelineValue sum
    ]

    const from = vi.fn(() => {
      const idx = callIndex++
      const result = results[idx] ?? { count: 0, error: null }
      const eq = vi.fn().mockResolvedValue(result)
      const select = vi.fn().mockReturnValue({ eq })
      return { select }
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/analytics/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('discovered')
    expect(json).toHaveProperty('applied')
    expect(json).toHaveProperty('won')
    expect(json).toHaveProperty('rejected')
    expect(json).toHaveProperty('pipelineValue')
    expect(json).toHaveProperty('winRate')
    expect(typeof json.discovered).toBe('number')
    expect(typeof json.applied).toBe('number')
    expect(typeof json.won).toBe('number')
    expect(typeof json.rejected).toBe('number')
    expect(typeof json.pipelineValue).toBe('number')
    expect(typeof json.winRate).toBe('number')
  })

  it('returns zeros on DB error', async () => {
    const eq = vi.fn().mockResolvedValue({ count: null, data: null, error: new Error('DB down') })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/analytics/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.discovered).toBe(0)
    expect(json.applied).toBe(0)
    expect(json.won).toBe(0)
    expect(json.rejected).toBe(0)
    expect(json.pipelineValue).toBe(0)
    expect(json.winRate).toBe(0)
  })
})
