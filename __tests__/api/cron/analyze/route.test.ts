import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/intelligence/win-loss', () => ({
  analyzeWinLoss: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'
import { analyzeWinLoss } from '@/lib/intelligence/win-loss'

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedAnalyzeWinLoss = vi.mocked(analyzeWinLoss)

const MOCK_REPORT = {
  segments: [],
  topPerformers: [{ dimension: 'funder_type:federal', attempts: 5, wins: 4, winRate: 0.8 }],
  poorPerformers: [],
  relationshipFirstFunders: [],
  analyzedAt: '2026-05-21T09:00:00.000Z',
}

function buildSupabaseMock() {
  const insert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ insert })
  mockedCreateServiceClient.mockResolvedValue({ from } as any)
  return { insert }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('GET /api/cron/analyze', () => {
  it('returns 401 without correct secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/analyze/route')
    const req = new Request('http://localhost/api/cron/analyze', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(401)

    vi.unstubAllEnvs()
  })

  it('returns 200 with report on success', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    mockedAnalyzeWinLoss.mockResolvedValue(MOCK_REPORT)
    buildSupabaseMock()

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/analyze/route')
    const req = new Request('http://localhost/api/cron/analyze', {
      headers: { authorization: 'Bearer real-secret' },
    })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.report).toBeDefined()
    expect(body.report.analyzedAt).toBe(MOCK_REPORT.analyzedAt)

    vi.unstubAllEnvs()
  })

  it('creates a notifications record with win/loss report', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')
    mockedAnalyzeWinLoss.mockResolvedValue(MOCK_REPORT)
    const { insert } = buildSupabaseMock()

    vi.resetModules()
    const { GET } = await import('@/app/api/cron/analyze/route')
    const req = new Request('http://localhost/api/cron/analyze', {
      headers: { authorization: 'Bearer real-secret' },
    })
    await GET(req as any)

    expect(insert).toHaveBeenCalledOnce()
    const notif = insert.mock.calls[0][0]
    expect(notif.type).toBe('win_loss_report')
    expect(notif.title).toBe('Weekly Win/Loss Analysis')
    expect(typeof notif.body).toBe('string')

    vi.unstubAllEnvs()
  })
})
