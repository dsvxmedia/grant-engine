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

describe('GET /api/grants', () => {
  it('returns grants array', async () => {
    const grants = [
      { id: 'g1', title: 'Tech Grant', funder_name: 'ACME', status: 'active', deadline: '2026-12-01' },
      { id: 'g2', title: 'Arts Grant', funder_name: 'Foundations Inc', status: 'active', deadline: '2026-11-01' },
    ]
    const limit = vi.fn().mockResolvedValue({ data: grants, error: null })
    const order2 = vi.fn().mockReturnValue({ limit })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/grants/route')
    const req = new Request('http://localhost/api/grants')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.grants).toEqual(grants)
    expect(from).toHaveBeenCalledWith('grants')
  })

  it('applies search filter using ilike on title and funder_name', async () => {
    const grants = [{ id: 'g1', title: 'Tech Innovation Grant', funder_name: 'ACME', status: 'active' }]
    const limit = vi.fn().mockResolvedValue({ data: grants, error: null })
    const order2 = vi.fn().mockReturnValue({ limit })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const orFn = vi.fn().mockReturnValue({ order: order1 })
    const eq = vi.fn().mockReturnValue({ or: orFn })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/grants/route')
    const req = new Request('http://localhost/api/grants?search=tech')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.grants).toEqual(grants)
    expect(orFn).toHaveBeenCalledWith(expect.stringContaining('ilike'))
  })

  it('returns empty array on DB error', async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') })
    const order2 = vi.fn().mockReturnValue({ limit })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/grants/route')
    const req = new Request('http://localhost/api/grants')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.grants).toEqual([])
  })
})
