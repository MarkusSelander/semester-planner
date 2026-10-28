'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navIsActive, primaryNav } from './nav-items'

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 py-1.5 backdrop-blur-sm md:hidden"
    >
      <ul className="grid grid-cols-4">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = navIsActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-[10px] tracking-wide uppercase font-mono transition-[color,transform] duration-[var(--duration-micro)] ease-out-quart active:scale-[0.98]',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.75} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
