import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(authHeader?: string) {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) {
    headers['authorization'] = authHeader
  }
  return new Request('http://localhost/api/cron/video', { headers })
}

// Builds a mock Supabase client where:
//   grants query chain: .select().eq().eq() resolves to { data: grants, error: null }
//   video_submissions:  .select().eq().maybeSingle() resolves to { data: null, error: null }
//   notifications:      .insert() resolves to { error: null }
// Returns the individual mock fns so tests can assert on them.
function makeSupabaseMock(grants: { id: string; title: string }[]) {
  // notifications
  const notifInsert = vi.fn().mockResolvedValue({ error: null })

  // video_submissions: select → eq → maybeSingle (dedup check)
  const submissionMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const submissionEq = vi.fn().mockReturnValue({ maybeSingle: submissionMaybeSingle })
  const submissionSelect = vi.fn().mockReturnValue({ eq: submissionEq })

  // video_submissions: insert (creates the row so the dedup check works next run)
  const submissionInsert = vi.fn().mockResolvedValue({ error: null })

  // grants: select → eq('requires_video') → eq('status') — last eq must return a thenable
  const grantsEq2 = vi.fn().mockResolvedValue({ data: grants, error: null })
  const grantsEq1 = vi.fn().mockReturnValue({ eq: grantsEq2 })
  const grantsSelect = vi.fn().mockReturnValue({ eq: grantsEq1 })

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'grants') return { select: grantsSelect }
    if (table === 'video_submissions') return { select: submissionSelect, insert: submissionInsert }
    if (table === 'notifications') return { insert: notifInsert }
    return {}
  })

  return { from, notifInsert, submissionMaybeSingle, submissionEq, submissionInsert }
}

describe('GET /api/cron/video', () => {
  it('returns 401 without secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const { GET } = await import('@/app/api/cron/video/route')
    const req = makeRequest('Bearer wrong-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBeDefined()

    vi.unstubAllEnvs()
  })

  it('returns 200 with queued count', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const grants = [
      { id: 'g1', title: 'Video Grant 1' },
      { id: 'g2', title: 'Video Grant 2' },
    ]
    const { from } = makeSupabaseMock(grants)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/cron/video/route')
    const req = makeRequest('Bearer real-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.queued).toBe(2)

    vi.unstubAllEnvs()
  })

  it('creates notifications for queued grants', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret')

    const grants = [{ id: 'g1', title: 'My Video Grant' }]
    const { from, notifInsert } = makeSupabaseMock(grants)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/cron/video/route')
    const req = makeRequest('Bearer real-secret')
    await GET(req as any)

    expect(notifInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'video_queued',
        title: 'Grant added to Video Queue',
        body: 'My Video Grant',
      })
    )

    vi.unstubAllEnvs()
  })
})
