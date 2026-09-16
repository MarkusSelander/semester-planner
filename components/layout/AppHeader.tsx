import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { OverdueAlert } from '@/components/layout/OverdueAlert'
import type { OverdueEvent } from '@/lib/queries'

export function AppHeader({
  today,
  overdue,
  timeZone,
}: {
  today: string
  overdue: OverdueEvent[]
  timeZone: string
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{today}</span>
      </div>

      {overdue.length === 0 ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          All caught up
        </span>
      ) : (
        <OverdueAlert items={overdue} timeZone={timeZone} />
      )}
    </header>
  )
}
