import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({ createServiceClient: vi.fn() }))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)

const VALID_UUID = '11111111-1111-4111-8111-111111111111'

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

// .select().order() — order() resolves to the result. eq() is inserted before
// order() only when filtering by entity_id, and returns the same { order }.
function listChain(result: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ order, eq })
  return { select, order, eq }
}

// .select().eq().single() — used to check an entity exists.
function entityChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  return { select, eq, single }
}

// .insert().select().single()
function insertChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  return { insert, select, single }
}

describe('GET /api/profile/impact-metrics', () => {
  it('returns the metrics list with no entity_id filter', async () => {
    const metrics = [{ id: 'a', metric_name: 'Jobs' }]
    const { select, order } = listChain({ data: metrics, error: null })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/impact-metrics/route')
    const res = await GET(
      jsonRequest('http://localhost/api/profile/impact-metrics', 'GET') as any
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.metrics).toEqual(metrics)
    expect(from).toHaveBeenCalledWith('impact_metrics')
    expect(order).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('filters by entity_id when provided', async () => {
    const metrics = [{ id: 'a', entity_id: VALID_UUID }]
    const { select, eq } = listChain({ data: metrics, error: null })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/impact-metrics/route')
    const res = await GET(
      jsonRequest(
        `http://localhost/api/profile/impact-metrics?entity_id=${VALID_UUID}`,
        'GET'
      ) as any
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.metrics).toEqual(metrics)
    expect(eq).toHaveBeenCalledWith('entity_id', VALID_UUID)
  })

  it('returns 400 for an invalid entity_id', async () => {
    const { GET } = await import('@/app/api/profile/impact-metrics/route')
    const res = await GET(
      jsonRequest(
        'http://localhost/api/profile/impact-metrics?entity_id=not-a-uuid',
        'GET'
      ) as any
    )
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    const { select } = listChain({ data: null, error: { message: 'boom' } })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/profile/impact-metrics/route')
    const res = await GET(
      jsonRequest('http://localhost/api/profile/impact-metrics', 'GET') as any
    )
    expect(res.status).toBe(500)
  })
})

describe('POST /api/profile/impact-metrics', () => {
  it('creates a metric with valid data (201)', async () => {
    const entity = entityChain({ data: { id: VALID_UUID }, error: null })
    const created = {
      id: 'new',
      entity_id: VALID_UUID,
      metric_name: 'Jobs',
      metric_value: 100,
    }
    const insert = insertChain({ data: created, error: null })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: entity.select })
      .mockReturnValueOnce({ insert: insert.insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/profile/impact-metrics/route')
    const res = await POST(
      jsonRequest('http://localhost/api/profile/impact-metrics', 'POST', {
        entity_id: VALID_UUID,
        metric_name: 'Jobs',
        metric_value: 100,
      }) as any
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.metric).toEqual(created)
    expect(insert.insert).toHaveBeenCalledWith({
      entity_id: VALID_UUID,
      metric_name: 'Jobs',
      metric_value: 100,
    })
  })

  it('returns 400 on missing metric_name', async () => {
    const { POST } = await import('@/app/api/profile/impact-metrics/route')
    const res = await POST(
      jsonRequest('http://localhost/api/profile/impact-metrics', 'POST', {
        entity_id: VALID_UUID,
        metric_value: 100,
      }) as any
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when the entity does not exist', async () => {
    const entity = entityChain({ data: null, error: { message: 'no rows' } })
    const from = vi.fn().mockReturnValue({ select: entity.select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/profile/impact-metrics/route')
    const res = await POST(
      jsonRequest('http://localhost/api/profile/impact-metrics', 'POST', {
        entity_id: VALID_UUID,
        metric_name: 'Jobs',
        metric_value: 100,
      }) as any
    )
    expect(res.status).toBe(404)
  })

  it('returns 500 on database error', async () => {
    const entity = entityChain({ data: { id: VALID_UUID }, error: null })
    const insert = insertChain({ data: null, error: { message: 'boom' } })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: entity.select })
      .mockReturnValueOnce({ insert: insert.insert })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/profile/impact-metrics/route')
    const res = await POST(
      jsonRequest('http://localhost/api/profile/impact-metrics', 'POST', {
        entity_id: VALID_UUID,
        metric_name: 'Jobs',
        metric_value: 100,
      }) as any
    )
    expect(res.status).toBe(500)
  })
})
