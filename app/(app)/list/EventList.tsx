'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Circle, CalendarArrowDown, AlertTriangle } from 'lucide-react'
import { ButtonAnchor, ButtonLink } from '@/components/ui/button'
import { isBefore } from 'date-fns'
import { toast } from 'sonner'
import type { ListEvent } from '@/lib/queries'
import {
  calendarDayKey,
  dateLabel,
  formatEvent,
  formatTz,
  isTodayTz,
} from '@/lib/dates'
import { HandInTag, TypeBadge, eventTypeMeta, isActionRequired } from '@/components/event-type'

type Semester = { id: string; name: string }
type View = 'all' | 'tasks' | 'lectures'

const TABS: { value: View; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'lectures', label: 'Lectures' },
]

type BaseStatus = 'Today' | 'Overdue' | 'Upcoming'

const STATUS_CLS: Record<BaseStatus | 'Done', string> = {
  Done: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Today: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  Upcoming: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

// Timezone-aware formatting is the expensive part of rendering hundreds of
// rows, so it is computed once per event list rather than on every toggle.
type RowDisplay = { dayKey: string; time: string; baseStatus: BaseStatus; isPast: boolean }

function rowDisplay(ev: ListEvent, timeZone: string, now: Date): RowDisplay {
  const d = new Date(ev.startAt)
  const isPast = isBefore(d, now)
  return {
    dayKey: calendarDayKey(ev.startAt, timeZone, ev.isAllDay),
    time: ev.isAllDay ? 'All day' : formatEvent(ev.startAt, 'HH:mm', timeZone),
    baseStatus: isTodayTz(d, timeZone) ? 'Today' : isPast ? 'Overdue' : 'Upcoming',
    isPast,
  }
}

const EventRow = memo(function EventRow({
  ev,
  isDone,
  display,
  onToggle,
}: {
  ev: ListEvent
  isDone: boolean
  display: RowDisplay
  onToggle: (id: string) => void
}) {
  const status = isDone ? 'Done' : display.baseStatus
  const emphasize = isActionRequired(ev.type)
  const meta = eventTypeMeta(ev.type)
  return (
    <div
      className={`flex items-stretch gap-3 pr-4 py-3 transition-colors hover:bg-slate-50 ${isDone ? 'opacity-60' : ''} ${emphasize ? 'bg-slate-50/40' : ''}`}
    >
      {/* Type accent: thick for things you must hand in, faint for lectures */}
      <div className={`${emphasize ? 'w-1.5' : 'w-1'} flex-shrink-0 rounded-r ${meta.accent}`} />

      <button
        onClick={() => onToggle(ev.id)}
        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        className="flex-shrink-0 self-center text-slate-300 hover:text-emerald-500 transition-colors"
      >
        {isDone
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : <Circle className="h-5 w-5" />}
      </button>

      <div
        className="w-1 h-7 self-center rounded-full flex-shrink-0"
        style={{ backgroundColor: ev.course.color }}
      />

      <Link href={`/events/${ev.id}`} className="flex-1 min-w-0 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate ${isDone ? 'line-through text-slate-400' : emphasize ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'}`}>
            {ev.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {ev.course.code ?? ev.course.name} · {display.time}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isDone && <HandInTag type={ev.type} />}
          <TypeBadge type={ev.type} />
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[status]}`}>
            {status}
          </span>
        </div>
      </Link>
    </div>
  )
})

export function EventList({
  initialEvents,
  semesters,
  semesterId,
  typeFilter,
  doneFilter,
  view,
  overdueOnly = false,
  timeZone,
}: {
  initialEvents: ListEvent[]
  semesters: Semester[]
  semesterId: string
  typeFilter: string
  doneFilter: string
  view: View
  overdueOnly?: boolean
  timeZone: string
}) {
  const router = useRouter()
  const [doneById, setDoneById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialEvents.map(ev => [ev.id, ev.isDone]))
  )

  const displayById = useMemo(() => {
    const now = new Date()
    return new Map(initialEvents.map(ev => [ev.id, rowDisplay(ev, timeZone, now)]))
  }, [initialEvents, timeZone])

  const { grouped, dateKeys } = useMemo(() => {
    const visible = overdueOnly
      ? initialEvents.filter(ev => !doneById[ev.id] && displayById.get(ev.id)!.isPast)
      : initialEvents
    const groups: Record<string, ListEvent[]> = {}
    for (const ev of visible) {
      const key = displayById.get(ev.id)!.dayKey
      if (!groups[key]) groups[key] = []
      groups[key].push(ev)
    }
    const keys = Object.keys(groups).sort()
    return { grouped: groups, dateKeys: keys }
  }, [initialEvents, displayById, overdueOnly, doneById])

  function buildParams(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    if (semesterId) sp.set('semesterId', semesterId)
    if (typeFilter && view === 'all') sp.set('type', typeFilter)
    if (doneFilter) sp.set('done', doneFilter)
    if (view !== 'all') sp.set('view', view)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    return sp.toString()
  }

  function setView(newView: View) {
    const sp = new URLSearchParams()
    if (semesterId) sp.set('semesterId', semesterId)
    if (doneFilter) sp.set('done', doneFilter)
    if (newView !== 'all') sp.set('view', newView)
    router.push(`/list?${sp}`)
  }

  function setParam(key: string, value: string) {
    router.push(`/list?${buildParams({ [key]: value })}`)
  }

  const toggleDone = useCallback(async (id: string) => {
    const flip = () => setDoneById(prev => ({ ...prev, [id]: !prev[id] }))
    flip()
    try {
      const res = await fetch(`/api/events/${id}/done`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
    } catch {
      flip()
      toast.error('Failed to update')
    }
  }, [])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <div className="flex gap-2">
          <ButtonAnchor
            href={`/api/export/ics${semesterId ? `?semesterId=${semesterId}` : ''}`}
            download
            variant="outline"
          >
            <CalendarArrowDown className="h-4 w-4 mr-1.5" />
            Export
          </ButtonAnchor>
          <ButtonLink href="/events/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Add event
          </ButtonLink>
        </div>
      </div>

      {overdueOnly && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-800">Overdue &amp; unfinished</p>
            <p className="text-xs text-amber-700">
              These started before now and aren&apos;t checked off yet. Mark them done or reschedule them.
            </p>
          </div>
          <ButtonLink href="/list" variant="outline" size="sm" className="ml-auto flex-shrink-0">
            Show all
          </ButtonLink>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-5">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setView(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={semesterId}
          onChange={e => setParam('semesterId', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All semesters</option>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {view === 'all' && (
          <select
            value={typeFilter}
            onChange={e => setParam('type', e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All types</option>
            {['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'].map(t => (
              <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>
            ))}
          </select>
        )}

        <select
          value={doneFilter}
          onChange={e => setParam('done', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="false">Upcoming</option>
          <option value="true">Completed</option>
        </select>
      </div>

      {dateKeys.length === 0 ? (
        <div className="text-sm text-slate-400 py-16 text-center">
          {overdueOnly ? 'Nothing overdue — you\u2019re all caught up.' : 'No events found'}
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map(key => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {dateLabel(grouped[key][0].startAt, timeZone, grouped[key][0].isAllDay)}
                </h2>
                <span className="text-xs text-slate-400">{formatTz(`${key}T12:00:00Z`, 'd MMM', 'UTC')}</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {grouped[key].map(ev => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    isDone={doneById[ev.id]}
                    display={displayById.get(ev.id)!}
                    onToggle={toggleDone}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
