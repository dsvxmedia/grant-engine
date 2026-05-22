import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runVideoPipeline } from '@/lib/video/pipeline'

vi.mock('@/lib/video/pipeline', () => ({
  runVideoPipeline: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedRunVideoPipeline = vi.mocked(runVideoPipeline)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

function jsonRequest(url: string, body: unknown, authHeader?: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (authHeader !== undefined) {
    headers['authorization'] = authHeader
  }
  return new Request(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhooks/video', () => {
  it('returns 401 without secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const { POST } = await import('@/app/api/webhooks/video/route')
    const req = jsonRequest(
      'http://localhost/api/webhooks/video',
      { grant_match_id: '00000000-0000-0000-0000-000000000001' },
      'Bearer wrong-secret'
    )
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBeDefined()

    vi.unstubAllEnvs()
  })

  it('returns 200 and calls runVideoPipeline', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    const grantMatchId = '00000000-0000-0000-0000-000000000001'
    const result = { jobId: 'job-1', videoUrl: 'https://example.com/video.mp4', status: 'ready' }
    mockedRunVideoPipeline.mockResolvedValue(result as any)

    const { POST } = await import('@/app/api/webhooks/video/route')
    const req = jsonRequest(
      'http://localhost/api/webhooks/video',
      { grant_match_id: grantMatchId },
      'Bearer real-secret'
    )
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.result).toEqual(result)
    expect(mockedRunVideoPipeline).toHaveBeenCalledWith(grantMatchId)

    vi.unstubAllEnvs()
  })

  it('returns 400 for missing grant_match_id', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const { POST } = await import('@/app/api/webhooks/video/route')
    const req = jsonRequest(
      'http://localhost/api/webhooks/video',
      {},
      'Bearer real-secret'
    )
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()

    vi.unstubAllEnvs()
  })
})
