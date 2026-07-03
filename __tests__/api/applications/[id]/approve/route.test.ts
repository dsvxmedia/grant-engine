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

function patchRequest(url: string) {
  return new Request(url, { method: 'PATCH' })
}

// Builds a mock where grant_applications has both a fetch (select) and an update path.
// The fetch returns appData; the update chain returns appData.
function makeSupabaseMock(appData: Record<string, unknown> | null, fetchError?: { message: string }) {
  // Fetch chain: select('id, grant_match_id, grants(deadline)') → eq → single
  const fetchSingle = vi.fn().mockResolvedValue({ data: appData, error: fetchError ?? null })
  const fetchEq = vi.fn().mockReturnValue({ single: fetchSingle })
  const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq })

  // Update chain: update → eq → select → single
  const updateSingle = vi.fn().mockResolvedValue({ data: appData, error: appData ? null : { message: 'not found' } })
  const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
  const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
  const appUpdate = vi.fn().mockReturnValue({ eq: updateEq })

  // grant_matches update
  const matchEq = vi.fn().mockResolvedValue({ error: null })
  const matchUpdate = vi.fn().mockReturnValue({ eq: matchEq })

  const from = vi.fn((table: string) => {
    if (table === 'grant_applications') return { select: fetchSelect, update: appUpdate }
    if (table === 'grant_matches') return { update: matchUpdate }
    throw new Error(`unexpected table ${table}`)
  })

  return { from, appUpdate, fetchSelect, matchUpdate }
}

describe('PATCH /api/applications/[id]/approve', () => {
  it('returns 200 with updated application on success', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'approved',
      grants: { deadline: null },
    }
    const { from } = makeSupabaseMock(application)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/app-1/approve')
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.application).toEqual(application)
  })

  it('returns 404 when application not found', async () => {
    const { from } = makeSupabaseMock(null, { message: 'not found' })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/missing/approve')
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('updates status to approved', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'approved',
      grants: { deadline: null },
    }
    const { from, appUpdate } = makeSupabaseMock(application)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/app-1/approve')
    await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })

    expect(appUpdate).toHaveBeenCalledWith({ status: 'approved' })
  })

  it('returns 422 when grant deadline has passed', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'pending_review',
      grants: { deadline: '2020-01-01T00:00:00Z' }, // past deadline
    }
    const { from } = makeSupabaseMock(application)
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/approve/route')
    const req = patchRequest('http://localhost/api/applications/app-1/approve')
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toContain('deadline')
  })
})
