import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('server-only', () => ({}))
const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Thank you for the opportunity. We would greatly appreciate any feedback on our application. Please let us know why it was not selected.' }],
})

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate }
  }
  return { default: MockAnthropic }
})

const mockedCreateServiceClient = vi.mocked(createServiceClient)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  // Restore default Claude success response after each test
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: 'Thank you for the opportunity. We would greatly appreciate any feedback on our application. Please let us know why it was not selected.' }],
  })
})

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildSupabaseMock(application: unknown) {
  const appSingle = vi.fn().mockResolvedValue({ data: application, error: null })
  const appSelect = vi.fn().mockReturnValue({ single: appSingle })
  const appEq = vi.fn().mockReturnValue({ select: appSelect })
  const appUpdate = vi.fn().mockReturnValue({ eq: appEq })

  const matchEq = vi.fn().mockResolvedValue({ error: null })
  const matchUpdate = vi.fn().mockReturnValue({ eq: matchEq })

  const from = vi.fn((table: string) => {
    if (table === 'grant_applications') return { update: appUpdate }
    if (table === 'grant_matches') return { update: matchUpdate }
    throw new Error(`unexpected table ${table}`)
  })
  mockedCreateServiceClient.mockResolvedValue({ from } as any)
  return { appUpdate, appEq, matchUpdate }
}

describe('PATCH /api/applications/[id]/reject', () => {
  it('returns 200 with updated application on success', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'rejected',
      outcome: 'rejected',
      grant_title: 'Test Grant',
      funder_name: 'ACME Foundation',
    }
    buildSupabaseMock(application)

    const { PATCH } = await import('@/app/api/applications/[id]/reject/route')
    const req = jsonRequest('http://localhost/api/applications/app-1/reject', {})
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.application).toEqual(application)
  })

  it('returns 404 when application not found', async () => {
    const appSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const appSelect = vi.fn().mockReturnValue({ single: appSingle })
    const appEq = vi.fn().mockReturnValue({ select: appSelect })
    const appUpdate = vi.fn().mockReturnValue({ eq: appEq })
    const from = vi.fn((table: string) => {
      if (table === 'grant_applications') return { update: appUpdate }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/applications/[id]/reject/route')
    const req = jsonRequest('http://localhost/api/applications/missing/reject', {})
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns feedbackEmailDraft when feedbackEmail is true', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'rejected',
      outcome: 'rejected',
      grant_title: 'Innovation Grant',
      funder_name: 'ACME Foundation',
    }
    buildSupabaseMock(application)

    const { PATCH } = await import('@/app/api/applications/[id]/reject/route')
    const req = jsonRequest('http://localhost/api/applications/app-1/reject', {
      feedbackEmail: true,
    })
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.feedbackEmailDraft).not.toBeNull()
    expect(typeof json.feedbackEmailDraft).toBe('string')
    expect(json.feedbackEmailDraft.length).toBeGreaterThan(0)
  })

  it('returns null feedbackEmailDraft when Claude fails', async () => {
    const application = {
      id: '11111111-1111-1111-1111-111111111111',
      grant_match_id: 'gm-1',
      status: 'rejected',
      outcome: 'rejected',
      grant_title: 'Innovation Grant',
      funder_name: 'ACME Foundation',
    }
    buildSupabaseMock(application)

    // Make the shared mockCreate reject for this test
    mockCreate.mockRejectedValueOnce(new Error('Claude is down'))

    const { PATCH } = await import('@/app/api/applications/[id]/reject/route')
    const req = jsonRequest('http://localhost/api/applications/app-1/reject', {
      feedbackEmail: true,
    })
    const res = await PATCH(req as any, { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.feedbackEmailDraft).toBeNull()
  })
})
