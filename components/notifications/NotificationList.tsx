'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type NotificationRecord = {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  created_at: string
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'alert') {
    return <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
  }
  if (type === 'success' || type === 'awarded') {
    return <CheckCircle className="size-4 text-green-500 shrink-0 mt-0.5" />
  }
  return <Bell className="size-4 text-slate-400 shrink-0 mt-0.5" />
}

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: NotificationRecord[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [markingAll, setMarkingAll] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      startTransition(() => router.refresh())
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleMarkRead(id: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread`
            : 'All caught up'}
        </p>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={markingAll || isPending}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification items */}
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={() => {
                if (!notif.read) handleMarkRead(notif.id)
              }}
              className={cn(
                'flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 w-full',
                !notif.read && 'bg-blue-50/40'
              )}
            >
              <NotifIcon type={notif.type} />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span
                  className={cn(
                    'text-sm text-foreground',
                    !notif.read && 'font-semibold'
                  )}
                >
                  {notif.title}
                </span>
                {notif.body && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {notif.body}
                  </span>
                )}
                <span className="text-xs text-muted-foreground/70 mt-0.5">
                  {relativeTime(notif.created_at)}
                </span>
              </div>
              {!notif.read && (
                <span className="size-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
