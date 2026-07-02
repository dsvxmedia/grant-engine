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

function makeRequest(url: string, method = 'GET') {
  return new Request(url, { method })
}

describe('GET /api/applications/[id]', () => {
  it('returns 200 with application when found', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_id: 'g1',
      entity_id: 'e1',
      status: 'drafting',
      draft_content: { 'Executive Summary': 'We do great work.' },
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: application, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/[id]/route')
    const res = await GET(makeRequest('http://localhost/api/applications/app-1') as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.application).toEqual(application)
  })

  it('returns 404 when application not found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/[id]/route')
    const res = await GET(makeRequest('http://localhost/api/applications/missing') as any, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 500 on DB error', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/[id]/route')
    const res = await GET(makeRequest('http://localhost/api/applications/app-1') as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
