import { cn } from '@/lib/utils'

export function DateRail({
  day,
  weekday,
  time,
  children,
  muted = false,
  className,
}: {
  day: string
  weekday?: string
  time?: string
  children: React.ReactNode
  muted?: boolean
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-[3.75rem_minmax(0,1fr)] md:grid-cols-[4.5rem_minmax(0,1fr)]', muted && 'opacity-45', className)}>
      <div className="border-r border-primary/80 pr-3 pt-0.5 text-right font-mono text-[11px] leading-tight tabular-nums text-muted-foreground md:text-xs">
        <span className="block font-medium text-foreground">{day}</span>
        {weekday && <span className="block">{weekday}</span>}
        {time && <span className="mt-0.5 block">{time}</span>}
      </div>
      <div className="min-w-0 pl-3 md:pl-4">{children}</div>
    </div>
  )
}
