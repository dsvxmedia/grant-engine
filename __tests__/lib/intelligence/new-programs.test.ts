import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'

const mockedCreateServiceClient = vi.mocked(createServiceClient)

// Helper to build a Supabase mock for the new-programs query chain:
// from('grants').select('*').eq('is_new_program', true).gte('created_at', ...)
function buildGrantsChain(rows: unknown[], error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data: rows, error }),
  }
  return chain
}

function buildNotificationsInsert(error: unknown = null) {
  return vi.fn().mockResolvedValue({ error })
}

function buildSupabaseMock(
  grantRows: unknown[],
  grantError: unknown = null,
  notifError: unknown = null
) {
  const grantsChain = buildGrantsChain(grantRows, grantError)
  const notifInsert = buildNotificationsInsert(notifError)
  const notifChain = { insert: notifInsert }

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'grants') return grantsChain
    if (table === 'notifications') return notifChain
    return grantsChain
  })

  return { client: { from } as any, notifInsert }
}

describe('monitorNewPrograms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns zero counts when no new programs in last 24h', async () => {
    const { client } = buildSupabaseMock([])
    mockedCreateServiceClient.mockResolvedValue(client)

    const { monitorNewPrograms } = await import('@/lib/intelligence/new-programs')
    const result = await monitorNewPrograms()

    expect(result.detected).toBe(0)
    expect(result.sources.federal_register).toBe(0)
    expect(result.sources.manual).toBe(0)
  })

  it('creates a notification for each new program found', async () => {
    const grants = [
      { id: 'g1', title: 'New Climate Grant', source: 'federal-register' },
      { id: 'g2', title: 'New Tech Grant', source: 'federal-register' },
    ]
    const { client, notifInsert } = buildSupabaseMock(grants)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { monitorNewPrograms } = await import('@/lib/intelligence/new-programs')
    await monitorNewPrograms()

    // One insert call per grant
    expect(notifInsert).toHaveBeenCalledTimes(2)

    const firstCall = notifInsert.mock.calls[0][0]
    expect(firstCall.type).toBe('new_program')
    expect(firstCall.title).toBe('New grant program detected')
    expect(firstCall.body).toBe('New Climate Grant')
    expect(firstCall.metadata).toEqual({ grant_id: 'g1' })
  })

  it('returns correct source counts', async () => {
    const grants = [
      { id: 'g1', title: 'Federal Grant A', source: 'federal-register' },
      { id: 'g2', title: 'Federal Grant B', source: 'federal-register' },
      { id: 'g3', title: 'Manual Grant', source: 'manual' },
    ]
    const { client } = buildSupabaseMock(grants)
    mockedCreateServiceClient.mockResolvedValue(client)

    const { monitorNewPrograms } = await import('@/lib/intelligence/new-programs')
    const result = await monitorNewPrograms()

    expect(result.detected).toBe(3)
    expect(result.sources.federal_register).toBe(2)
    expect(result.sources.manual).toBe(1)
  })

  it('never throws on DB error', async () => {
    const { client } = buildSupabaseMock([], { message: 'DB connection error' })
    mockedCreateServiceClient.mockResolvedValue(client)

    const { monitorNewPrograms } = await import('@/lib/intelligence/new-programs')

    await expect(monitorNewPrograms()).resolves.toBeDefined()
    const result = await monitorNewPrograms()
    expect(result.detected).toBe(0)
  })
})
