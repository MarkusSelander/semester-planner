'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatEvent } from '@/lib/dates'
import { TypeBadge } from '@/components/event-type'
import type { OverdueEvent } from '@/lib/queries'

export function OverdueAlert({
  items,
  timeZone,
}: {
  items: OverdueEvent[]
  timeZone: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-overdue transition-colors duration-200 ease-out-quart hover:underline"
      >
        {items.length} overdue
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-[26rem] w-80 overflow-y-auto border border-border bg-popover p-2 shadow-sm">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-foreground">Not completed</p>
            <p className="text-xs text-muted-foreground">Started before now, still open.</p>
          </div>

          <div className="divide-y divide-border">
            {items.map(ev => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-2 py-2 transition-colors duration-200 ease-out-quart hover:bg-muted"
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
            onClick={() => setOpen(false)}
            className="mt-1 block px-2 py-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-primary hover:underline"
          >
            Review overdue
          </Link>
        </div>
      )}
    </div>
  )
}
