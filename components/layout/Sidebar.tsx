'use client'

import { useState } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { TIMEZONE_PERSISTED_KEY } from '@/lib/dates'
import { ThemeToggle } from '@/components/theme-toggle'
import { navIsActive, primaryNav, resourceNav, type NavItem } from './nav-items'

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

function NavLink({ href, label, icon: Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors duration-200 ease-out-quart',
        active
          ? 'border-primary font-medium text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {label}
      <PendingHint />
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

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
    <aside className="hidden h-full w-52 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="px-4 py-5">
        <Link href="/dashboard" className="block">
          <p className="font-heading text-lg leading-none tracking-tight text-foreground">Semester</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Planner</p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {primaryNav.map(item => (
          <NavLink key={item.href} {...item} active={navIsActive(pathname, item.href)} />
        ))}

        <p className="mt-6 mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Library
        </p>

        {resourceNav.map(item => (
          <NavLink key={item.href} {...item} active={navIsActive(pathname, item.href)} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-2 py-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 px-2 py-2 text-sm text-muted-foreground transition-colors duration-200 ease-out-quart hover:text-foreground disabled:opacity-60"
        >
          {signingOut
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={1.75} />
            : <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
