'use client'

import Link from 'next/link'
import { formatEvent } from '@/lib/dates'
import { TypeBadge } from '@/components/event-type'
import type { OverdueEvent } from '@/lib/queries'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

export function OverdueAlert({
  items,
  timeZone,
}: {
  items: OverdueEvent[]
  timeZone: string
}) {
  return (
    <Popover>
      <PopoverTrigger
        className="min-h-11 px-1 font-mono text-[11px] uppercase tracking-[0.12em] text-overdue transition-colors duration-[var(--duration-micro)] ease-out-quart hover:underline md:min-h-0"
        aria-label={`${items.length} overdue`}
      >
        {items.length} overdue
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 max-h-[26rem] gap-1 overflow-y-auto p-2">
        <PopoverHeader className="px-2 py-1.5">
          <PopoverTitle className="font-sans text-sm">Not completed</PopoverTitle>
          <PopoverDescription className="text-xs">Started before now, still open.</PopoverDescription>
        </PopoverHeader>
        <div className="divide-y divide-border">
          {items.map(ev => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="flex items-start gap-2.5 px-2 py-2.5 transition-colors duration-[var(--duration-micro)] ease-out-quart hover:bg-muted"
            >
              <span
                className="mt-1 h-4 w-0.5 shrink-0"
                style={{ backgroundColor: ev.course.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{ev.title}</p>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {ev.course.code ?? ev.course.name} ·{' '}
                  <span className="text-overdue">
                    {formatEvent(ev.startAt, 'd MMM', timeZone, ev.isAllDay)}
                  </span>
                </p>
              </div>
              <TypeBadge type={ev.type} />
            </Link>
          ))}
        </div>
        <Link
          href="/list?overdue=1"
          className="mt-1 block min-h-11 px-2 py-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-primary hover:underline md:min-h-0"
        >
          Review overdue
        </Link>
      </PopoverContent>
    </Popover>
  )
}
