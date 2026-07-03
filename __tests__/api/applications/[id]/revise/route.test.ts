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

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/applications/[id]/revise', () => {
  it('returns 200 after updating status to pending_review with merged notes', async () => {
    const existing = { draft_content: { sections: [], budget: {} } }
    const updated = {
      id: '11111111-1111-1111-1111-111111111111',
      status: 'pending_review',
      draft_content: { sections: [], budget: {}, user_revision_notes: 'Please improve the narrative.' },
    }

    // Fetch chain: select → eq → single
    const fetchSingle = vi.fn().mockResolvedValue({ data: existing, error: null })
    const fetchEq = vi.fn().mockReturnValue({ single: fetchSingle })
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq })

    // Update chain: update → eq → select → single
    const updateSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    const from = vi.fn().mockReturnValue({ select: fetchSelect, update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/applications/[id]/revise/route')
    const req = jsonRequest('http://localhost/api/applications/app-1/revise', {
      notes: 'Please improve the narrative.',
    })
    const res = await POST(req as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.application).toEqual(updated)
    expect(from).toHaveBeenCalledWith('grant_applications')
  })

  it('merges notes into existing draft_content without overwriting it', async () => {
    const existing = { draft_content: { sections: [{ name: 'Executive Summary' }] } }
    const updated = {
      id: '11111111-1111-1111-1111-111111111111',
      status: 'pending_review',
      draft_content: { sections: [{ name: 'Executive Summary' }], user_revision_notes: 'Fix the budget.' },
    }

    const fetchSingle = vi.fn().mockResolvedValue({ data: existing, error: null })
    const fetchEq = vi.fn().mockReturnValue({ single: fetchSingle })
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    const from = vi.fn().mockReturnValue({ select: fetchSelect, update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/applications/[id]/revise/route')
    const req = jsonRequest('http://localhost/api/applications/app-1/revise', {
      notes: 'Fix the budget.',
    })
    await POST(req as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })

    // Verify update was called with merged content (not just notes)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        draft_content: expect.objectContaining({
          sections: [{ name: 'Executive Summary' }],
          user_revision_notes: 'Fix the budget.',
        }),
      })
    )
  })

  it('returns 400 for invalid body (empty notes)', async () => {
    const from = vi.fn()
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/applications/[id]/revise/route')
    const req = jsonRequest('http://localhost/api/applications/app-1/revise', {
      notes: '',
    })
    const res = await POST(req as any, {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 404 when application not found', async () => {
    const fetchSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const fetchEq = vi.fn().mockReturnValue({ single: fetchSingle })
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq })
    const from = vi.fn().mockReturnValue({ select: fetchSelect })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/applications/[id]/revise/route')
    const req = jsonRequest('http://localhost/api/applications/missing/revise', {
      notes: 'Improve this section.',
    })
    const res = await POST(req as any, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
