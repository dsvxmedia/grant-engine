import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/notifications
// Returns: { notifications: NotificationRecord[], unreadCount: number }
export async function GET(_request: NextRequest) {
  const supabase = await createServiceClient()

  // Cast bypasses placeholder database.types.ts that lacks notifications table yet.
  const { data, error } = await (supabase as any)
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('GET /api/notifications failed:', error)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }

  const notifications = data ?? []
  const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length

  return NextResponse.json({ notifications, unreadCount })
}

// PATCH /api/notifications
// Body: { id: string }          → mark one notification read
// Body: { markAllRead: true }   → mark all read
// Returns: { ok: true }
export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient()
  const body = await request.json().catch(() => ({}))

  if (body.id) {
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', body.id)
  } else {
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
  }

  return NextResponse.json({ ok: true })
}
