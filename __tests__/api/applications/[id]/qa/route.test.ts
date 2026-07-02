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

function makeRequest(url: string) {
  return new Request(url, { method: 'GET' })
}

describe('GET /api/applications/[id]/qa', () => {
  it('returns 200 with qa data when application is found', async () => {
    const qaData = {
      id: '11111111-1111-1111-1111-111111111111',
      qa_scores: {
        narrative: { score: 8, issues: [], passed: true },
        clarity: { score: 7.5, issues: [], passed: true },
        compliance: { score: 8.5, issues: [], passed: true },
      },
      qa_passed: true,
      qa_retry_count: 1,
      status: 'pending_review',
    }

    const maybeSingle = vi.fn().mockResolvedValue({ data: qaData, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/[id]/qa/route')
    const res = await GET(makeRequest('http://localhost/api/applications/app-1/qa') as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.application).toEqual(qaData)
    expect(from).toHaveBeenCalledWith('grant_applications')
    expect(select).toHaveBeenCalledWith('id, qa_scores, qa_passed, qa_retry_count, status')
  })

  it('returns 404 when application not found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/applications/[id]/qa/route')
    const res = await GET(makeRequest('http://localhost/api/applications/missing/qa') as any, {
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

    const { GET } = await import('@/app/api/applications/[id]/qa/route')
    const res = await GET(makeRequest('http://localhost/api/applications/app-1/qa') as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
