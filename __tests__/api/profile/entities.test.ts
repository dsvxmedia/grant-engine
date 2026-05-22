import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAngles } from '@/lib/profile/angles'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/profile/angles', () => ({
  generateAngles: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedGenerateAngles = vi.mocked(generateAngles)

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

describe('GET /api/profile/entities', () => {
  it('returns entities list ordered parents-first', async () => {
    const entities = [
      { id: '1', name: 'Parent', type: 'parent', parent_id: null },
      { id: '2', name: 'Child', type: 'subsidiary', parent_id: '1' },
    ]
    const order = vi.fn().mockResolvedValue({ data: entities, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/entities/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.entities).toEqual(entities)
    expect(from).toHaveBeenCalledWith('business_entities')
  })

  it('returns 500 on database error', async () => {
    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/entities/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST /api/profile/entities', () => {
  it('creates entity with valid data', async () => {
    const created = { id: '1', name: 'Acme', type: 'parent' }
    const single = vi.fn().mockResolvedValue({ data: created, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/profile/entities/route')
    const req = jsonRequest('http://localhost/api/profile/entities', 'POST', {
      name: 'Acme',
      type: 'parent',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.entity).toEqual(created)
    expect(insert).toHaveBeenCalledWith({ name: 'Acme', type: 'parent' })
  })

  it('returns 400 on missing name', async () => {
    const { POST } = await import('@/app/api/profile/entities/route')
    const req = jsonRequest('http://localhost/api/profile/entities', 'POST', {
      type: 'parent',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(json.details).toBeDefined()
  })
})

describe('GET /api/profile/entities/[id]', () => {
  it('returns entity', async () => {
    const entity = { id: '1', name: 'Acme', type: 'parent' }
    const single = vi.fn().mockResolvedValue({ data: entity, error: null })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/entities/[id]/route')
    const res = await GET(jsonRequest('http://localhost/x', 'GET') as any, {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.entity).toEqual(entity)
  })

  it('returns 404 when not found', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/entities/[id]/route')
    const res = await GET(jsonRequest('http://localhost/x', 'GET') as any, {
      params: Promise.resolve({ id: 'nope' }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Entity not found')
  })
})

describe('PATCH /api/profile/entities/[id]', () => {
  it('updates entity', async () => {
    const updated = { id: '1', name: 'New Name', type: 'parent' }
    const single = vi.fn().mockResolvedValue({ data: updated, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/profile/entities/[id]/route')
    const req = jsonRequest('http://localhost/x', 'PATCH', { name: 'New Name' })
    const res = await PATCH(req as any, {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.entity).toEqual(updated)
    expect(update).toHaveBeenCalledWith({ name: 'New Name' })
  })
})

describe('POST /api/profile/entities/[id]/angles', () => {
  it('returns angles on success', async () => {
    const entity = { id: '1', name: 'Acme', type: 'parent' }
    const angles = ['a', 'b', 'c', 'd', 'e']

    const single = vi.fn().mockResolvedValue({ data: entity, error: null })
    const selectEq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: selectEq })

    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    const from = vi.fn().mockReturnValue({ select, update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)
    mockedGenerateAngles.mockResolvedValue(angles)

    const { POST } = await import(
      '@/app/api/profile/entities/[id]/angles/route'
    )
    const res = await POST(jsonRequest('http://localhost/x', 'POST') as any, {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.angles).toEqual(angles)
    expect(mockedGenerateAngles).toHaveBeenCalledWith(entity)
    expect(update).toHaveBeenCalledWith({ pitch_angles_generated: angles })
  })

  it('returns 404 when entity not found', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import(
      '@/app/api/profile/entities/[id]/angles/route'
    )
    const res = await POST(jsonRequest('http://localhost/x', 'POST') as any, {
      params: Promise.resolve({ id: 'nope' }),
    })
    expect(res.status).toBe(404)
    expect(mockedGenerateAngles).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/profile/entities/[id]', () => {
  it('deletes entity', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null, count: 1 })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { DELETE } = await import('@/app/api/profile/entities/[id]/route')
    const res = await DELETE(jsonRequest('http://localhost/x', 'DELETE') as any, {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(204)
  })
})
