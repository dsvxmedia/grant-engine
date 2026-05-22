import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/intelligence/new-programs', () => ({
  monitorNewPrograms: vi.fn(),
}))

import { monitorNewPrograms } from '@/lib/intelligence/new-programs'

const mockedMonitorNewPrograms = vi.mocked(monitorNewPrograms)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('GET /api/cron/new-programs', () => {
  it('returns 401 without correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/new-programs/route')
    const req = new Request('http://localhost/api/cron/new-programs', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(401)

    vi.unstubAllEnvs()
  })

  it('returns 200 with result on success', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    mockedMonitorNewPrograms.mockResolvedValue({
      detected: 3,
      sources: { federal_register: 2, manual: 1 },
    })

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/new-programs/route')
    const req = new Request('http://localhost/api/cron/new-programs', {
      headers: { authorization: 'Bearer real-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.result.detected).toBe(3)
    expect(body.result.sources.federal_register).toBe(2)
    expect(body.result.sources.manual).toBe(1)

    vi.unstubAllEnvs()
  })
})
