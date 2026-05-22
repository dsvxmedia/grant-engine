import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { runVideoPipeline } from '@/lib/video/pipeline'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/video/pipeline', () => ({
  runVideoPipeline: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedRunVideoPipeline = vi.mocked(runVideoPipeline)

beforeEach(() => {
  vi.clearAllMocks()
})

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/video', () => {
  it('returns submissions array', async () => {
    const submissions = [
      { id: 'sub-1', render_status: 'ready', created_at: '2026-05-21T00:00:00.000Z' },
      { id: 'sub-2', render_status: 'pending', created_at: '2026-05-20T00:00:00.000Z' },
    ]
    const order = vi.fn().mockResolvedValue({ data: submissions, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/video/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.submissions).toEqual(submissions)
    expect(from).toHaveBeenCalledWith('video_submissions')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

describe('POST /api/video', () => {
  it('calls runVideoPipeline with grant_match_id', async () => {
    // Use a valid RFC 4122 v4 UUID
    const grantMatchId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const result = { jobId: 'job-1', videoUrl: 'https://example.com/video.mp4', status: 'ready' }
    mockedRunVideoPipeline.mockResolvedValue(result as any)

    const { POST } = await import('@/app/api/video/route')
    const req = jsonRequest('http://localhost/api/video', { grant_match_id: grantMatchId })
    const res = await POST(req as any)

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.result).toEqual(result)
    expect(mockedRunVideoPipeline).toHaveBeenCalledWith(grantMatchId)
  })

  it('returns 400 for invalid UUID', async () => {
    const { POST } = await import('@/app/api/video/route')
    const req = jsonRequest('http://localhost/api/video', { grant_match_id: 'not-a-uuid' })
    const res = await POST(req as any)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(mockedRunVideoPipeline).not.toHaveBeenCalled()
  })

  it('returns 500 on pipeline error', async () => {
    const grantMatchId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
    mockedRunVideoPipeline.mockRejectedValue(new Error('Pipeline failure'))

    const { POST } = await import('@/app/api/video/route')
    const req = jsonRequest('http://localhost/api/video', { grant_match_id: grantMatchId })
    const res = await POST(req as any)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
