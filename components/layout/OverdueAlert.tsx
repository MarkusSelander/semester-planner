'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
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

  // Close on outside click / Escape. Links inside close via their own onClick.
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
        className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 transition-colors hover:bg-amber-200"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {items.length} unfinished from earlier
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-[26rem] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold text-slate-800">Not completed yet</p>
            <p className="text-xs text-slate-500">
              Events from before now that you haven&apos;t checked off.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map(ev => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
              >
                <span
                  className="mt-0.5 h-8 w-1 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: ev.course.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ev.course.code ?? ev.course.name} ·{' '}
                    <span className="font-medium text-rose-600">
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
            className="mt-1 block rounded-lg px-2 py-2 text-center text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Review all overdue
          </Link>
        </div>
      )}
    </div>
  )
}
