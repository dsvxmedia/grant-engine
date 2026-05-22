import { describe, it, expect, vi } from 'vitest'

describe('GET /api/cron/discover', () => {
  it('returns 401 without correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    const { GET } = await import('@/app/api/cron/discover/route')
    const req = new Request('http://localhost/api/cron/discover', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('returns 200 with correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    vi.resetModules()
    const { GET } = await import('@/app/api/cron/discover/route')
    const req = new Request('http://localhost/api/cron/discover', {
      headers: { authorization: 'Bearer real-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    vi.unstubAllEnvs()
  })
})
