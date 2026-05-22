import { Header } from '@/components/layout/Header'
import { NotificationList } from '@/components/notifications/NotificationList'
import { createServiceClient } from '@/lib/supabase/server'
import type { NotificationRecord } from '@/components/notifications/NotificationList'

export default async function NotificationsPage() {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Notifications page fetch failed:', error)
  }

  const notifications: NotificationRecord[] = data ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Notifications" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <NotificationList initialNotifications={notifications} />
        </div>
      </div>
    </div>
  )
}
