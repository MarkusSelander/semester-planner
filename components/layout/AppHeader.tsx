import { Suspense } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { OverdueAlert } from '@/components/layout/OverdueAlert'
import { ThemeToggle } from '@/components/theme-toggle'
import { getOverdueEvents } from '@/lib/queries'

async function OverdueStatus({ userId, timeZone }: { userId: string; timeZone: string }) {
  const overdue = await getOverdueEvents(userId)

  if (overdue.length === 0) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-done">Caught up</span>
    )
  }

  return <OverdueAlert items={overdue} timeZone={timeZone} />
}

export function AppHeader({
  today,
  userId,
  timeZone,
}: {
  today: string
  userId: string
  timeZone: string
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 md:px-6">
      <div className="min-w-0 md:hidden">
        <Link href="/dashboard" className="font-heading text-base tracking-tight">
          Semester
        </Link>
      </div>
      <p className="hidden font-mono text-xs tabular-nums text-muted-foreground md:block">{today}</p>

      <div className="flex items-center gap-1 md:gap-2">
        <div className="flex items-center md:hidden">
          <ThemeToggle compact />
          <Link
            href="/settings"
            className="inline-flex size-11 items-center justify-center text-muted-foreground transition-colors duration-[var(--duration-micro)] ease-out-quart hover:text-foreground md:size-8"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
        <Suspense fallback={<span className="skeleton-shimmer h-4 w-24 rounded-sm bg-muted" aria-hidden />}>
          <OverdueStatus userId={userId} timeZone={timeZone} />
        </Suspense>
      </div>
    </header>
  )
}
