import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

const MOCK_PARTNERS = [
  {
    id: 'p1',
    name: 'Tech Alliance',
    mission: 'Bridging technology access for underserved communities',
    type: 'nonprofit',
    contact_email: 'info@techalliance.org',
    relationship_strength: 5,
    created_at: '2026-01-15T00:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('GET /api/coalition', () => {
  it('returns partners array', async () => {
    const order = vi.fn().mockResolvedValue({ data: MOCK_PARTNERS, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/coalition/route')
    const req = new Request('http://localhost/api/coalition')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.partners).toEqual(MOCK_PARTNERS)
  })
})

describe('POST /api/coalition', () => {
  it('creates partner and returns 201', async () => {
    const newPartner = { ...MOCK_PARTNERS[0], id: 'p2', name: 'Green Future' }
    const selectAfterInsert = vi.fn().mockResolvedValue({ data: [newPartner], error: null })
    const insert = vi.fn().mockReturnValue({ select: selectAfterInsert })
    const from = vi.fn().mockReturnValue({ insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/coalition/route')
    const req = new Request('http://localhost/api/coalition', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Green Future',
        mission: 'Environmental sustainability',
        type: 'nonprofit',
        contact_email: 'info@greenfuture.org',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.partner).toEqual(newPartner)
  })

  it('returns 400 for missing name', async () => {
    const { POST } = await import('@/app/api/coalition/route')
    const req = new Request('http://localhost/api/coalition', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mission: 'Some mission' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})
