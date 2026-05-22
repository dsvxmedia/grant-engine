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

describe('PATCH /api/video/[id]/approve', () => {
  it('returns 200 on success with approved status', async () => {
    const updated = {
      id: 'sub-1',
      render_status: 'approved',
      approved_at: '2026-05-22T00:00:00.000Z',
    }
    const single = vi.fn().mockResolvedValue({ data: updated, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/video/[id]/approve/route')
    const req = new Request('http://localhost/api/video/sub-1/approve', {
      method: 'PATCH',
    })
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'sub-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.submission.render_status).toBe('approved')
  })

  it('returns 404 when not found', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/video/[id]/approve/route')
    const req = new Request('http://localhost/api/video/missing/approve', {
      method: 'PATCH',
    })
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
