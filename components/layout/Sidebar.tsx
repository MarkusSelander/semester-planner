'use client'

import { useState } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { TIMEZONE_PERSISTED_KEY } from '@/lib/dates'
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  GitBranch,
  GraduationCap,
  BookOpen,
  Settings,
  LogOut,
  BookMarked,
  Loader2,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/timeline', label: 'Timeline', icon: GitBranch },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/list', label: 'Events', icon: ListChecks },
]

const resourceItems = [
  { href: '/semesters', label: 'Semesters', icon: GraduationCap },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function PendingHint() {
  const { pending } = useLinkStatus()
  return (
    <Loader2
      aria-hidden
      data-pending={pending}
      className="nav-pending-hint ml-auto h-3.5 w-3.5 shrink-0 animate-spin"
    />
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: typeof LayoutDashboard
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      <PendingHint />
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function signOut() {
    setSigningOut(true)
    try {
      await createClient().auth.signOut({ scope: 'local' })
    } finally {
      try {
        localStorage.removeItem(TIMEZONE_PERSISTED_KEY)
      } catch {
        // storage unavailable
      }
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
          <BookMarked className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">Semester Planner</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <div className="pt-5 pb-1.5 px-3">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Manage</p>
        </div>

        {resourceItems.map(item => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-800">
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors disabled:opacity-60"
        >
          {signingOut
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            : <LogOut className="h-4 w-4 shrink-0" />}
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
