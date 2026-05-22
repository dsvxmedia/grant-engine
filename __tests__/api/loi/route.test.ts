import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { generateLoi } from '@/lib/loi/generate'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/loi/generate', () => ({
  generateLoi: vi.fn(),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedGenerateLoi = vi.mocked(generateLoi)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('GET /api/loi', () => {
  it('returns list of submissions', async () => {
    const submissions = [
      { id: 's1', grant_id: 'g1', entity_id: 'e1', status: 'draft' },
      { id: 's2', grant_id: 'g2', entity_id: 'e2', status: 'submitted' },
    ]
    const order = vi
      .fn()
      .mockResolvedValue({ data: submissions, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/loi/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.submissions).toEqual(submissions)
    expect(from).toHaveBeenCalledWith('loi_submissions')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

describe('POST /api/loi', () => {
  const grantId = '11111111-1111-4111-8111-111111111111'
  const entityId = '22222222-2222-4222-8222-222222222222'

  it('returns 400 on invalid input (missing grant_id)', async () => {
    const { POST } = await import('@/app/api/loi/route')
    const req = jsonRequest('http://localhost/api/loi', 'POST', {
      entity_id: entityId,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(json.details).toBeDefined()
  })

  it('creates LOI and returns 201', async () => {
    const grant = {
      id: grantId,
      title: 'Test Grant',
      funder_name: 'Test Funder',
      description: 'A grant',
      eligibility_text: '501(c)(3)',
      award_min: 10000,
      award_max: 50000,
      loi_deadline: '2026-12-01',
    }
    const entity = {
      id: entityId,
      name: 'Test Org',
      mission: 'Do good',
      focus_area: 'youth',
      state: 'AL',
      city: 'Birmingham',
      who_we_serve: ['urban youth'],
    }
    const founder = { origin_story: 'I started this org because...' }
    const created = {
      id: 'sub-1',
      grant_id: grantId,
      entity_id: entityId,
      loi_content: 'Dear Foundation, ...',
      status: 'draft',
      full_application_triggered: false,
    }

    // grant fetch
    const grantMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: grant, error: null })
    const grantEq = vi.fn().mockReturnValue({ maybeSingle: grantMaybeSingle })
    const grantSelect = vi.fn().mockReturnValue({ eq: grantEq })

    // entity fetch
    const entityMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: entity, error: null })
    const entityEq = vi.fn().mockReturnValue({ maybeSingle: entityMaybeSingle })
    const entitySelect = vi.fn().mockReturnValue({ eq: entityEq })

    // founder fetch
    const founderMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: founder, error: null })
    const founderLimit = vi
      .fn()
      .mockReturnValue({ maybeSingle: founderMaybeSingle })
    const founderOrder = vi.fn().mockReturnValue({ limit: founderLimit })
    const founderSelect = vi.fn().mockReturnValue({ order: founderOrder })

    // insert
    const insertSingle = vi
      .fn()
      .mockResolvedValue({ data: created, error: null })
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
    const insert = vi.fn().mockReturnValue({ select: insertSelect })

    const from = vi.fn((table: string) => {
      if (table === 'grants') return { select: grantSelect }
      if (table === 'business_entities') return { select: entitySelect }
      if (table === 'founder_profile') return { select: founderSelect }
      if (table === 'loi_submissions') return { insert }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    mockedGenerateLoi.mockResolvedValue({
      content: 'Dear Foundation, ...',
      wordCount: 600,
    })

    const { POST } = await import('@/app/api/loi/route')
    const req = jsonRequest('http://localhost/api/loi', 'POST', {
      grant_id: grantId,
      entity_id: entityId,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.submission).toEqual(created)
    expect(mockedGenerateLoi).toHaveBeenCalledWith({
      grant,
      entity,
      founderStory: founder.origin_story,
    })
    expect(insert).toHaveBeenCalledWith({
      grant_id: grantId,
      entity_id: entityId,
      loi_content: 'Dear Foundation, ...',
      status: 'draft',
      full_application_triggered: false,
    })
  })

  it('returns 404 if grant not found', async () => {
    const grantMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null })
    const grantEq = vi.fn().mockReturnValue({ maybeSingle: grantMaybeSingle })
    const grantSelect = vi.fn().mockReturnValue({ eq: grantEq })

    const from = vi.fn((table: string) => {
      if (table === 'grants') return { select: grantSelect }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/loi/route')
    const req = jsonRequest('http://localhost/api/loi', 'POST', {
      grant_id: grantId,
      entity_id: entityId,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Grant not found')
    expect(mockedGenerateLoi).not.toHaveBeenCalled()
  })

  it('returns 500 if generateLoi throws', async () => {
    const grant = { id: grantId, title: 'Test' }
    const entity = { id: entityId, name: 'Test Org' }

    const grantMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: grant, error: null })
    const grantEq = vi.fn().mockReturnValue({ maybeSingle: grantMaybeSingle })
    const grantSelect = vi.fn().mockReturnValue({ eq: grantEq })

    const entityMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: entity, error: null })
    const entityEq = vi.fn().mockReturnValue({ maybeSingle: entityMaybeSingle })
    const entitySelect = vi.fn().mockReturnValue({ eq: entityEq })

    const founderMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null })
    const founderLimit = vi
      .fn()
      .mockReturnValue({ maybeSingle: founderMaybeSingle })
    const founderOrder = vi.fn().mockReturnValue({ limit: founderLimit })
    const founderSelect = vi.fn().mockReturnValue({ order: founderOrder })

    const from = vi.fn((table: string) => {
      if (table === 'grants') return { select: grantSelect }
      if (table === 'business_entities') return { select: entitySelect }
      if (table === 'founder_profile') return { select: founderSelect }
      throw new Error(`unexpected table ${table}`)
    })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    mockedGenerateLoi.mockRejectedValue(new Error('LLM exploded'))

    const { POST } = await import('@/app/api/loi/route')
    const req = jsonRequest('http://localhost/api/loi', 'POST', {
      grant_id: grantId,
      entity_id: entityId,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('LOI generation failed')
    expect(json.details).toContain('LLM exploded')
  })
})
