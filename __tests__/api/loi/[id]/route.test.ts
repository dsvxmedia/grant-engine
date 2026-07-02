import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/loi/generate', () => ({
  generateLoi: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('GET /api/loi/[id]', () => {
  it('returns 404 when submission not found', async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/loi/[id]/route')
    const res = await GET(jsonRequest('http://localhost/x', 'GET') as any, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('LOI submission not found')
  })

  it('returns submission when found', async () => {
    const submission = {
      id: '33333333-3333-3333-3333-333333333333',
      grant_id: 'g1',
      entity_id: 'e1',
      loi_content: 'hi',
      status: 'draft',
    }
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: submission, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/loi/[id]/route')
    const res = await GET(jsonRequest('http://localhost/x', 'GET') as any, {
      params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.submission).toEqual(submission)
  })
})

describe('PATCH /api/loi/[id]', () => {
  it('updates loi_content', async () => {
    const updated = {
      id: '33333333-3333-3333-3333-333333333333',
      grant_id: 'g1',
      entity_id: 'e1',
      loi_content: 'new content',
      status: 'draft',
    }
    const single = vi.fn().mockResolvedValue({ data: updated, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/loi/[id]/route')
    const req = jsonRequest('http://localhost/x', 'PATCH', {
      loi_content: 'new content',
    })
    const res = await PATCH(req as any, {
      params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.submission).toEqual(updated)
    expect(update).toHaveBeenCalledWith({ loi_content: 'new content' })
  })

  it('sets submitted_at when status becomes submitted', async () => {
    const updated = {
      id: '33333333-3333-3333-3333-333333333333',
      grant_id: 'g1',
      entity_id: 'e1',
      loi_content: 'final',
      status: 'submitted',
      submitted_at: '2026-05-21T00:00:00.000Z',
    }
    const single = vi.fn().mockResolvedValue({ data: updated, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/loi/[id]/route')
    const req = jsonRequest('http://localhost/x', 'PATCH', {
      status: 'submitted',
    })
    const res = await PATCH(req as any, {
      params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }),
    })
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledTimes(1)
    const updatePayload = update.mock.calls[0][0]
    expect(updatePayload.status).toBe('submitted')
    expect(typeof updatePayload.submitted_at).toBe('string')
    expect(updatePayload.submitted_at.length).toBeGreaterThan(0)
  })
})

describe('DELETE /api/loi/[id]', () => {
  it('returns 400 when submission is not draft', async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({
        data: { id: '33333333-3333-3333-3333-333333333333', status: 'submitted' },
        error: null,
      })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { DELETE } = await import('@/app/api/loi/[id]/route')
    const res = await DELETE(jsonRequest('http://localhost/x', 'DELETE') as any, {
      params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Only draft LOIs can be deleted')
  })
})
