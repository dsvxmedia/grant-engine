import Link from 'next/link'
import { Bell } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

export function Header({
  title,
  unreadCount,
}: {
  title: string
  unreadCount?: number
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount != null && unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <UserButton />
      </div>
    </header>
  )
}
