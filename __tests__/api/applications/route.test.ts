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

describe('GET /api/applications', () => {
  it('returns 200 with applications array', async () => {
    const applications = [
      { id: 'app-1', grant_id: 'g1', entity_id: 'e1', status: 'drafting', created_at: '2026-05-21T00:00:00.000Z' },
      { id: 'app-2', grant_id: 'g2', entity_id: 'e2', status: 'approved', created_at: '2026-05-20T00:00:00.000Z' },
    ]
    const order = vi.fn().mockResolvedValue({ data: applications, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.applications).toEqual(applications)
    expect(from).toHaveBeenCalledWith('grant_applications')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('handles DB error by returning 500', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/route')
    const res = await GET()
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
