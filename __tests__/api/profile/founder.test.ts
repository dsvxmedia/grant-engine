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

function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

// Builds the .select().order().limit().maybeSingle() chain used for fetching
// the single founder record.
function fetchChain(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const limit = vi.fn().mockReturnValue({ maybeSingle })
  const order = vi.fn().mockReturnValue({ limit })
  const select = vi.fn().mockReturnValue({ order })
  return { select, order, limit, maybeSingle }
}

describe('GET /api/profile/founder', () => {
  it('returns { profile: null } when no record exists', async () => {
    const { select } = fetchChain({ data: null, error: null })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/founder/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profile).toBeNull()
    expect(from).toHaveBeenCalledWith('founder_profile')
  })

  it('returns the founder profile when one exists', async () => {
    const profile = { id: '1', owner_name: 'Jane' }
    const { select } = fetchChain({ data: profile, error: null })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/founder/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profile).toEqual(profile)
  })

  it('returns 500 on database error', async () => {
    const { select } = fetchChain({ data: null, error: { message: 'boom' } })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/founder/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/profile/founder', () => {
  it('creates a new profile when none exists (insert path)', async () => {
    const fetch = fetchChain({ data: null, error: null })
    const created = { id: '1', owner_name: 'Jane', origin_story: 'Start.' }
    const single = vi.fn().mockResolvedValue({ data: created, error: null })
    const insertSelect = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: insertSelect })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: fetch.select })
      .mockReturnValueOnce({ insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/profile/founder/route')
    const req = jsonRequest('http://localhost/api/profile/founder', 'PATCH', {
      owner_name: 'Jane',
      origin_story: 'Start.',
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profile).toEqual(created)
    expect(insert).toHaveBeenCalledWith({
      owner_name: 'Jane',
      origin_story: 'Start.',
    })
  })

  it('updates the existing profile (update path)', async () => {
    const fetch = fetchChain({ data: { id: 'abc' }, error: null })
    const updated = { id: 'abc', owner_name: 'New' }
    const single = vi.fn().mockResolvedValue({ data: updated, error: null })
    const updateSelect = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: fetch.select })
      .mockReturnValueOnce({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/profile/founder/route')
    const req = jsonRequest('http://localhost/api/profile/founder', 'PATCH', {
      owner_name: 'New',
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profile).toEqual(updated)
    expect(update).toHaveBeenCalledWith({ owner_name: 'New' })
    expect(eq).toHaveBeenCalledWith('id', 'abc')
  })

  it('returns 400 on invalid body', async () => {
    const { PATCH } = await import('@/app/api/profile/founder/route')
    const req = jsonRequest('http://localhost/api/profile/founder', 'PATCH', {
      key_milestones: 'not-an-array',
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(json.details).toBeDefined()
  })

  it("defaults owner_name to 'Founder' when inserting without a name", async () => {
    const fetch = fetchChain({ data: null, error: null })
    const created = { id: '1', owner_name: 'Founder' }
    const single = vi.fn().mockResolvedValue({ data: created, error: null })
    const insertSelect = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: insertSelect })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: fetch.select })
      .mockReturnValueOnce({ insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/profile/founder/route')
    const req = jsonRequest('http://localhost/api/profile/founder', 'PATCH', {
      origin_story: 'No name yet.',
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith({
      origin_story: 'No name yet.',
      owner_name: 'Founder',
    })
  })
})
