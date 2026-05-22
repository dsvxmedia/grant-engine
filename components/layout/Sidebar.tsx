'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, FileText, User,
  Calendar, BarChart3, Bell, Settings, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/',              icon: LayoutDashboard, label: 'Pipeline' },
  { href: '/review',        icon: FileText,        label: 'Review Queue' },
  { href: '/loi',           icon: Send,            label: 'LOI Queue' },
  { href: '/explorer',      icon: Search,          label: 'Explorer' },
  { href: '/calendar',      icon: Calendar,        label: 'Calendar' },
  { href: '/profile',       icon: User,            label: 'Profile' },
  { href: '/analytics',     icon: BarChart3,       label: 'Analytics' },
  { href: '/notifications', icon: Bell,            label: 'Notifications' },
  { href: '/settings',      icon: Settings,        label: 'Settings' },
]

export function Sidebar({ unreadCount }: { unreadCount?: number }) {
  const pathname = usePathname()
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-background px-3 py-4">
      <div className="mb-6 px-2">
        <h1 className="text-sm font-semibold tracking-tight">Grant Engine</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="relative flex-none">
              <Icon className="h-4 w-4" />
              {href === '/notifications' && unreadCount != null && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
