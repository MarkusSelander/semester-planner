'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <BookMarked className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">Semester Planner</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-5 pb-1.5 px-3">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Manage</p>
        </div>

        {resourceItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-800">
        <Link
          href="/login"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </Link>
      </div>
    </aside>
  )
}
