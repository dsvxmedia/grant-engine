import { createServiceClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'new_match'
  | 'deadline_warning'
  | 'scraper_alert'
  | 'loi_due'
  | 'qa_failed'
  | 'awarded'
  | 'rejected'
  | 'alert'
  | 'success'

export interface NotificationPayload {
  type: NotificationType
  title: string
  body?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await (supabase as any).from('notifications').insert({
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      metadata: payload.metadata ?? {},
      read: false,
    })
  } catch (err) {
    console.error('[notifications] failed to insert notification', err)
  }
}

export async function createNotifications(payloads: NotificationPayload[]): Promise<void> {
  if (payloads.length === 0) return
  try {
    const supabase = await createServiceClient()
    await (supabase as any).from('notifications').insert(
      payloads.map((p) => ({
        type: p.type,
        title: p.title,
        body: p.body ?? null,
        metadata: p.metadata ?? {},
        read: false,
      }))
    )
  } catch (err) {
    console.error('[notifications] failed to insert notifications', err)
  }
}
