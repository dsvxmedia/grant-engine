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

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/notifications', () => {
  it('returns notifications and unreadCount', async () => {
    const notifications = [
      { id: 'n1', message: 'Grant approved', read: false, created_at: '2026-05-21T00:00:00Z' },
      { id: 'n2', message: 'New match', read: true, created_at: '2026-05-20T00:00:00Z' },
    ]
    const limit = vi.fn().mockResolvedValue({ data: notifications, error: null })
    const order = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/notifications/route')
    const req = new Request('http://localhost/api/notifications')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.notifications).toEqual(notifications)
    expect(json.unreadCount).toBe(1)
  })

  it('PATCH marks all notifications as read', async () => {
    const updateResult = vi.fn().mockResolvedValue({ error: null })
    const gtFn = vi.fn().mockReturnValue({ update: updateResult })
    // For PATCH, we do update().gt() or update() with a truthy condition
    // Actually: update({ read: true }) returns a builder; we call something to execute
    const update = vi.fn().mockReturnValue({ error: null, then: undefined })
    // Use a simpler approach: update returns resolved value directly for PATCH
    const updateResolved = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ update: updateResolved })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { PATCH } = await import('@/app/api/notifications/route')
    const req = jsonRequest('http://localhost/api/notifications', { markAllRead: true })
    const res = await PATCH(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles DB error gracefully', async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') })
    const order = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { GET } = await import('@/app/api/notifications/route')
    const req = new Request('http://localhost/api/notifications')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.notifications).toEqual([])
    expect(json.unreadCount).toBe(0)
  })
})
