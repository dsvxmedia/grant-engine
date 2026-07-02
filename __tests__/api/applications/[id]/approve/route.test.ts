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

function patchRequest(url: string) {
  return new Request(url, { method: 'PATCH' })
}

describe('PATCH /api/applications/[id]/approve', () => {
  it('returns 200 with updated application on success', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'approved',
    }
    // grant_applications update chain
    const appSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appSelect = vi.fn().mockReturnValue({ single: appSingle })
    const appEq = vi.fn().mockReturnValue({ select: appSelect })
    const appUpdate = vi.fn().mockReturnValue({ eq: appEq })

    // grant_matches update chain
    const matchEq = vi.fn().mockResolvedValue({ error: null })
    const matchUpdate = vi.fn().mockReturnValue({ eq: matchEq })

    const from = vi.fn((table: string) => {
      if (table === 'grant_applications') return { update: appUpdate }
      if (table === 'grant_matches') return { update: matchUpdate }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/app-1/approve')
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.application).toEqual(application)
  })

  it('returns 404 when application not found', async () => {
    const appSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const appSelect = vi.fn().mockReturnValue({ single: appSingle })
    const appEq = vi.fn().mockReturnValue({ select: appSelect })
    const appUpdate = vi.fn().mockReturnValue({ eq: appEq })

    const from = vi.fn((table: string) => {
      if (table === 'grant_applications') return { update: appUpdate }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/missing/approve')
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('updates status to approved', async () => {
    const application = { id: '11111111-1111-1111-1111-111111111111', grant_match_id: 'gm-1', status: 'approved' }
    const appSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const appSelect = vi.fn().mockReturnValue({ single: appSingle })
    const appEq = vi.fn().mockReturnValue({ select: appSelect })
    const appUpdate = vi.fn().mockReturnValue({ eq: appEq })

    const matchEq = vi.fn().mockResolvedValue({ error: null })
    const matchUpdate = vi.fn().mockReturnValue({ eq: matchEq })

    const from = vi.fn((table: string) => {
      if (table === 'grant_applications') return { update: appUpdate }
      if (table === 'grant_matches') return { update: matchUpdate }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/app-1/approve')
    await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })

    expect(appUpdate).toHaveBeenCalledWith({ status: 'approved' })
    expect(appEq).toHaveBeenCalledWith('id', '11111111-1111-1111-1111-111111111111')
  })
})
