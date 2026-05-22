import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runQAGate } from '@/lib/qa/gate'

vi.mock('@/lib/qa/gate', () => ({ runQAGate: vi.fn() }))
vi.mock('server-only', () => ({}))

const mockedRunQAGate = vi.mocked(runQAGate)

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

describe('POST /api/webhooks/qa', () => {
  it('returns 401 without correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const { POST } = await import('@/app/api/webhooks/qa/route')
    const req = jsonRequest(
      'http://localhost/api/webhooks/qa',
      { applicationId: 'app-1' },
      'Bearer wrong-secret'
    )
    const res = await POST(req as any)

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBeDefined()

    vi.unstubAllEnvs()
  })

  it('returns 200 and calls runQAGate with the applicationId', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const qaResult = {
      narrative: { score: 8, issues: [], passed: true },
      clarity: { score: 8, issues: [], passed: true },
      compliance: { score: 8, issues: [], passed: true },
      overallPassed: true,
      retryCount: 0,
      flaggedForManualReview: false,
    }
    mockedRunQAGate.mockResolvedValue(qaResult)

    const { POST } = await import('@/app/api/webhooks/qa/route')
    const req = jsonRequest(
      'http://localhost/api/webhooks/qa',
      { applicationId: 'app-1' },
      'Bearer real-secret'
    )
    const res = await POST(req as any)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.result).toEqual(qaResult)
    expect(mockedRunQAGate).toHaveBeenCalledWith('app-1')

    vi.unstubAllEnvs()
  })

  it('returns 400 for missing applicationId', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const { POST } = await import('@/app/api/webhooks/qa/route')
    const req = jsonRequest(
      'http://localhost/api/webhooks/qa',
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
