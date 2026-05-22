import { Sidebar } from '@/components/layout/Sidebar'
import { createServiceClient } from '@/lib/supabase/server'

async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createServiceClient()
    const { count, error } = await (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
    if (error || count === null) return 0
    return count
  } catch {
    return 0
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const unreadCount = await getUnreadCount()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar unreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
