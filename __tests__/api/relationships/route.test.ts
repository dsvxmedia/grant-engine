import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

const MOCK_OFFICERS = [
  {
    id: 'po1',
    funder_name: 'Acme Foundation',
    name: 'Jane Smith',
    email: 'jane@acme.org',
    focus_areas: ['education', 'workforce'],
    relationship_strength: 7,
    last_contact_date: '2026-04-01T00:00:00Z',
    contact_history: [],
    created_at: '2026-01-01T00:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('GET /api/relationships', () => {
  it('returns officers array', async () => {
    const order = vi.fn().mockResolvedValue({ data: MOCK_OFFICERS, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/relationships/route')
    const req = new Request('http://localhost/api/relationships')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.officers).toEqual(MOCK_OFFICERS)
  })
})

describe('POST /api/relationships', () => {
  it('creates officer and returns 201', async () => {
    const newOfficer = { ...MOCK_OFFICERS[0], id: 'po2' }
    const selectAfterInsert = vi.fn().mockResolvedValue({ data: [newOfficer], error: null })
    const insert = vi.fn().mockReturnValue({ select: selectAfterInsert })
    const from = vi.fn().mockReturnValue({ insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/relationships/route')
    const req = new Request('http://localhost/api/relationships', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        funder_name: 'Acme Foundation',
        name: 'Jane Smith',
        email: 'jane@acme.org',
        focus_areas: ['education'],
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.officer).toEqual(newOfficer)
  })

  it('returns 400 for missing funder_name', async () => {
    const { POST } = await import('@/app/api/relationships/route')
    const req = new Request('http://localhost/api/relationships', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Jane Smith' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})
